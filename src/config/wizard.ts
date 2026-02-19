import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";
import type {
  OlimpusConfig,
  MetaAgentDef,
  RoutingRule,
  ProviderConfig,
  Settings,
} from "./schema.js";
import {
  type WizardAnswers,
  type PromptOption,
  type OptionsPrompt,
  type SimplePrompt,
  WIZARD_PROMPTS,
  PROJECT_TYPES,
  META_AGENT_PRESETS,
  PROVIDER_MODELS,
  SETTING_PRESETS,
  isOptionsPrompt,
  isSimplePrompt,
  getProjectType,
  getProviderModel,
  type ProjectTypeId,
} from "./prompts.js";

/**
 * Config template for a specific project type
 */
interface ProjectConfigTemplate {
  /**
   * Default meta-agents to enable for this project type
   */
  defaultMetaAgents: string[];

  /**
   * Default agent configurations for this project type
   */
  defaultAgents?: Partial<Record<string, { model: string; temperature: number; description: string }>>;

  /**
   * Default categories for this project type
   */
  defaultCategories?: Record<string, { description: string; model?: string; temperature?: number }>;

  /**
   * Default settings overrides for this project type
   */
  defaultSettings?: {
    background_parallelization?: boolean;
    adaptive_model_selection?: boolean;
    lsp_refactoring_preferred?: boolean;
  };
}

/**
 * Project type config templates
 * Each project type has sensible defaults for meta-agents, agents, and categories
 */
const PROJECT_CONFIG_TEMPLATES: Record<ProjectTypeId, ProjectConfigTemplate> = {
  /**
   * Web Application - Frontend-focused development
   */
  web: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto", "frontend_specialist"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "TDD-focused implementation for web apps",
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.5,
        description: "Strategic analysis for frontend architecture",
      },
    },
    defaultCategories: {
      frontend: {
        description: "Frontend development tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      ui_components: {
        description: "UI component development",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      styling: {
        description: "CSS, Tailwind, and styling tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      testing: {
        description: "Frontend testing with vitest/cypress",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true,
    },
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
        description: "TDD-focused implementation for APIs",
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.4,
        description: "Strategic analysis for API architecture",
      },
    },
    defaultCategories: {
      backend: {
        description: "Backend development and API tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      database: {
        description: "Database schema and migrations",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      api: {
        description: "REST/GraphQL API endpoints",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      testing: {
        description: "API testing and integration tests",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true,
    },
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
        description: "TDD-focused implementation for full-stack apps",
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.5,
        description: "Strategic analysis for full-stack architecture",
      },
    },
    defaultCategories: {
      frontend: {
        description: "Frontend development tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      backend: {
        description: "Backend development and API tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.4,
      },
      database: {
        description: "Database schema and migrations",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      api: {
        description: "REST/GraphQL API endpoints",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      testing: {
        description: "End-to-end and integration tests",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      deployment: {
        description: "CI/CD and deployment configuration",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true,
    },
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
        description: "TDD-focused implementation for CLI tools",
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.4,
        description: "Strategic analysis for CLI design",
      },
    },
    defaultCategories: {
      core: {
        description: "Core CLI logic and commands",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      ui: {
        description: "CLI interface and user experience",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      testing: {
        description: "CLI testing and integration tests",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      documentation: {
        description: "CLI help and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
    },
    defaultSettings: {
      background_parallelization: false,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true,
    },
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
        description: "TDD-focused implementation for libraries",
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "Strategic analysis for API design",
      },
    },
    defaultCategories: {
      core: {
        description: "Core library functionality",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      api: {
        description: "Public API design and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      testing: {
        description: "Unit tests and test coverage",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
      examples: {
        description: "Example usage and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
    },
    defaultSettings: {
      background_parallelization: false,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true,
    },
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
        description: "TDD-focused implementation agent",
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.5,
        description: "Strategic analysis and architecture advisor",
      },
    },
    defaultCategories: {
      general: {
        description: "General development tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
      },
      documentation: {
        description: "Technical writing and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
      },
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true,
    },
  },
};

/**
 * Get config template for a project type
 */
function getProjectTemplate(projectType: string): ProjectConfigTemplate {
  return PROJECT_CONFIG_TEMPLATES[projectType as ProjectTypeId] || PROJECT_CONFIG_TEMPLATES.other;
}

/**
 * Result of the wizard execution
 */
export interface WizardResult {
  config: OlimpusConfig;
  answers: WizardAnswers;
  path: string;
}

/**
 * Options for running the wizard
 */
export interface WizardOptions {
  /**
   * Path where the config should be written
   * Defaults to ~/.config/opencode/olimpus.jsonc
   */
  configPath?: string;

  /**
   * Whether to skip confirmation prompts
   */
  autoConfirm?: boolean;

  /**
   * Input stream (for testing)
   */
  input?: NodeJS.ReadableStream;

  /**
   * Output stream (for testing)
   */
  output?: NodeJS.WritableStream;
}

/**
 * Readline interface wrapper
 */
class ReadlineInterface {
  private rl: readline.Interface;

  constructor(input: NodeJS.ReadableStream, output: NodeJS.WritableStream) {
    this.rl = readline.createInterface({
      input,
      output,
      terminal: true,
    });
  }

  /**
   * Ask a single-line question
   */
  async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask a password/hidden question (for sensitive input)
   * Note: Node.js readline doesn't support true hidden input without external deps
   * This is a placeholder for future enhancement
   */
  async questionHidden(prompt: string): Promise<string> {
    return this.question(prompt);
  }

  /**
   * Ask a yes/no question
   */
  async confirm(prompt: string, defaultValue = true): Promise<boolean> {
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
  print(message: string): void {
    this.rl.write(message);
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.rl.close();
  }
}

/**
 * Display options in a formatted list
 */
function displayOptions(options: PromptOption[], selectedIndex?: number): void {
  options.forEach((opt, index) => {
    const prefix = index === selectedIndex ? "> " : "  ";
    const description = opt.description ? ` - ${opt.description}` : "";
    console.log(`${prefix}${index + 1}. ${opt.label}${description}`);
  });
}

/**
 * Display multiple selection options with checkboxes
 */
function displayMultiSelectOptions(
  options: PromptOption[],
  selectedIndices: Set<number>,
): void {
  options.forEach((opt, index) => {
    const selected = selectedIndices.has(index);
    const checkbox = selected ? "[x]" : "[ ]";
    const description = opt.description ? ` - ${opt.description}` : "";
    console.log(`  ${checkbox} ${index + 1}. ${opt.label}${description}`);
  });
}

/**
 * Navigate through a menu with arrow keys or number selection
 */
async function selectOption(
  rli: ReadlineInterface,
  prompt: string,
  help?: string,
): Promise<PromptOption> {
  // Get options from the prompt
  const optionsPrompt: OptionsPrompt =
    WIZARD_PROMPTS[prompt as keyof typeof WIZARD_PROMPTS] as OptionsPrompt;
  if (!isOptionsPrompt(optionsPrompt)) {
    throw new Error(`Prompt "${prompt}" is not an options prompt`);
  }

  const options = optionsPrompt.options;

  if (help) {
    console.log(`💡 ${help}\n`);
  }

  // Simple numeric selection for now
  // TODO: Add arrow key navigation support
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

/**
 * Navigate through a multi-select menu
 */
async function selectMultipleOptions(
  rli: ReadlineInterface,
  prompt: string,
  help?: string,
  defaults?: boolean[],
): Promise<PromptOption[]> {
  const optionsPrompt: OptionsPrompt =
    WIZARD_PROMPTS[prompt as keyof typeof WIZARD_PROMPTS] as OptionsPrompt;
  if (!isOptionsPrompt(optionsPrompt)) {
    throw new Error(`Prompt "${prompt}" is not an options prompt`);
  }

  const options = optionsPrompt.options;
  const selected = new Set<number>();

  // Initialize with defaults
  if (defaults) {
    defaults.forEach((enabled, index) => {
      if (enabled) selected.add(index);
    });
  }

  if (help) {
    console.log(`💡 ${help}`);
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

  return Array.from(selected).map<number, PromptOption>((i) => options[i]);
}

/**
 * Ask for text input
 */
async function askText(
  rli: ReadlineInterface,
  promptId: string,
  defaultValue?: string,
): Promise<string> {
  const promptObj: WizardPrompt =
    WIZARD_PROMPTS[promptId as keyof typeof WIZARD_PROMPTS];
  if (!isSimplePrompt(promptObj) || typeof promptObj.message === "function") {
    throw new Error(`Prompt "${promptId}" is not a simple text prompt`);
  }

  const promptText = defaultValue
    ? `${promptObj.message} [${defaultValue}]: `
    : `${promptObj.message}: `;

  const answer = await rli.question(promptText);
  return answer || defaultValue || "";
}

/**
 * Display a message and wait for user to continue
 */
async function showMessage(
  rli: ReadlineInterface,
  promptId: string,
  ...args: unknown[]
): Promise<void> {
  const promptObj: WizardPrompt =
    WIZARD_PROMPTS[promptId as keyof typeof WIZARD_PROMPTS];
  if (!isSimplePrompt(promptObj)) {
    throw new Error(`Prompt "${promptId}" is not a simple prompt`);
  }

  const message =
    typeof promptObj.message === "function"
      ? promptObj.message(...args)
      : promptObj.message;

  console.log(message);
  await rli.question("");
}

/**
 * Create meta-agent definitions based on selections
 */
function createMetaAgents(
  selectedIds: string[],
  baseModel: string,
): Record<string, MetaAgentDef> {
  const templates: Record<string, MetaAgentDef> = {
    atenea: {
      base_model: baseModel,
      delegates_to: ["oracle", "prometheus", "atlas", "metis"],
      routing_rules: [
        {
          matcher: { type: "complexity", threshold: "high" },
          target_agent: "oracle",
          config_overrides: {
            prompt:
              "You are a strategic architecture advisor. Analyze this complex problem from first principles, considering system design patterns, scalability, maintainability, and long-term implications.",
          },
        },
        {
          matcher: { type: "always" },
          target_agent: "metis",
          config_overrides: {
            prompt:
              "You are a general technical analyst. Synthesize information and provide comprehensive analysis.",
          },
        },
      ],
    },
    hermes: {
      base_model: baseModel,
      delegates_to: ["librarian", "explore", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "keyword",
            keywords: ["docs", "documentation", "guide", "search", "lookup"],
            mode: "any",
          },
          target_agent: "librarian",
          config_overrides: {
            prompt: "You are a research specialist. Search comprehensively for documentation and guides.",
          },
        },
        {
          matcher: { type: "always" },
          target_agent: "librarian",
        },
      ],
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
            has_deps: ["vitest", "jest", "bun:test"],
          },
          target_agent: "sisyphus",
          config_overrides: {
            prompt: "You are a TDD expert. Write tests first, then implementation.",
            variant: "tdd",
          },
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus",
          config_overrides: {
            prompt:
              "You are a builder. Implement with attention to quality and best practices.",
          },
        },
      ],
    },
    frontend_specialist: {
      base_model: baseModel,
      delegates_to: ["hephaestus", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "regex",
            pattern: "^(design|ui|component|button|form|style)",
            flags: "i",
          },
          target_agent: "hephaestus",
          config_overrides: {
            prompt: "You are a frontend specialist. Build responsive, accessible UI components.",
          },
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus",
        },
      ],
    },
  };

  const result: Record<string, MetaAgentDef> = {};
  for (const id of selectedIds) {
    if (templates[id]) {
      result[id] = templates[id];
    }
  }

  return result;
}

/**
 * Create provider configuration based on model selections
 */
function createProviderConfig(
  primaryModel: string,
  researchModel: string,
): ProviderConfig {
  const primaryModelData = getProviderModel(primaryModel);
  const researchModelData = getProviderModel(researchModel);

  const primaryProvider = primaryModelData?.provider || "anthropic";
  const researchProvider = researchModelData?.provider || "anthropic";

  return {
    priority_chain: [
      `${primaryProvider}/${primaryModel}`,
      `${researchProvider}/${researchModel}`,
    ],
    research_providers: [`${researchProvider}/${researchModel}`],
    strategy_providers: [`${primaryProvider}/${primaryModel}`],
    config: {
      anthropic: { retry_on_rate_limit: true },
      openai: { retry_on_rate_limit: true },
      google: { retry_on_rate_limit: true },
    },
  };
}

/**
 * Create settings configuration based on feature selections
 * @param selectedKeys - Settings explicitly selected by user
 * @param primaryModel - Primary model for strategy tasks
 * @param researchModel - Research model for background tasks
 * @param projectDefaults - Project type-specific default settings
 */
function createSettings(
  selectedKeys: string[],
  primaryModel: string,
  researchModel: string,
  projectDefaults?: ProjectConfigTemplate["defaultSettings"],
): Settings {
  const backgroundParallelization =
    selectedKeys.includes("background_parallelization") ||
    projectDefaults?.background_parallelization === true;
  const adaptiveModelSelection =
    selectedKeys.includes("adaptive_model_selection") ||
    projectDefaults?.adaptive_model_selection === true;
  const ultraworkEnabled = selectedKeys.includes("ultrawork_enabled");
  const todoContinuation = selectedKeys.includes("todo_continuation");
  const verifyBeforeCompletion = selectedKeys.includes("verify_before_completion");
  const lspRefactoringPreferred =
    selectedKeys.includes("lsp_refactoring_preferred") ||
    projectDefaults?.lsp_refactoring_preferred === true;
  const aggressiveCommentPruning = selectedKeys.includes("aggressive_comment_pruning");

  return {
    namespace_prefix: "olimpus",
    max_delegation_depth: 3,
    background_parallelization: backgroundParallelization
      ? {
          enabled: true,
          max_parallel_tasks: 3,
          timeout_ms: 30000,
        }
      : undefined,
    adaptive_model_selection: adaptiveModelSelection
      ? {
          enabled: true,
          research_model: researchModel,
          strategy_model: primaryModel,
          default_model: "claude-sonnet-4-20250217",
        }
      : undefined,
    ultrawork_enabled: ultraworkEnabled,
    todo_continuation: todoContinuation,
    verify_before_completion: verifyBeforeCompletion,
    lsp_refactoring_preferred: lspRefactoringPreferred,
    aggressive_comment_pruning: aggressiveCommentPruning,
  };
}

/**
 * Schema URL for JSONC files
 */
const SCHEMA_URL =
  "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json";

/**
 * Build Olimpus configuration from wizard answers
 */
function buildConfig(answers: WizardAnswers): OlimpusConfig {
  const primaryModel = answers.primary_model;
  const researchModel = answers.research_model;
  const projectTemplate = getProjectTemplate(answers.project_type);

  // Determine meta-agents to use: user selection or project template defaults
  const metaAgentIds =
    answers.meta_agents && answers.meta_agents.length > 0
      ? answers.meta_agents
      : projectTemplate.defaultMetaAgents;

  // Determine settings to use: user selection or empty (let template defaults apply in createSettings)
  const settings = answers.settings ?? [];

  // Build agents configuration: start with template defaults, then merge with models
  const agents: NonNullable<OlimpusConfig["agents"]> = {
    ...projectTemplate.defaultAgents,
  };

  // Update all agents to use the selected primary model
  for (const agentId in agents) {
    agents[agentId].model = primaryModel;
  }

  // Build categories: apply primary model if not specified in template
  const categories: NonNullable<OlimpusConfig["categories"]> = {};
  if (projectTemplate.defaultCategories) {
    for (const [categoryId, categoryDef] of Object.entries(
      projectTemplate.defaultCategories,
    )) {
      categories[categoryId] = {
        description: categoryDef.description,
        model: categoryDef.model ?? primaryModel,
        temperature: categoryDef.temperature ?? 0.3,
      };
    }
  }

  return {
    meta_agents: metaAgentIds.length > 0 ? createMetaAgents(metaAgentIds, primaryModel) : undefined,
    providers: createProviderConfig(primaryModel, researchModel),
    settings: createSettings(settings, primaryModel, researchModel, projectTemplate.defaultSettings),
    skills: answers.skills_path ? [answers.skills_path] : undefined,
    agents,
    categories,
    disabled_hooks: [],
  };
}

/**
 * Format configuration as JSONC with schema
 */
function formatConfigAsJsonc(config: OlimpusConfig): string {
  const jsonString = JSON.stringify(config, null, 2);
  // Prepend schema URL
  return `{
  "$schema": "${SCHEMA_URL}",\n` + jsonString.slice(1);
}

/**
 * Main wizard flow - collects user answers and generates config
 */
export async function runWizard(
  options: WizardOptions = {},
): Promise<WizardResult> {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;

  const rli = new ReadlineInterface(input, output);

  try {
    // Welcome screen
    await showMessage(rli, "welcome");

    // Collect answers
    const answers: WizardAnswers = {
      project_type: "",
      language: "",
      primary_model: "",
      research_model: "",
    };

    // Project type
    const projectType = await selectOption(rli, "project_type", WIZARD_PROMPTS.project_type.help);
    answers.project_type = projectType.value;

    // Language
    const language = await selectOption(rli, "language", WIZARD_PROMPTS.language.help);
    answers.language = language.value;

    // Meta-agents
    const metaAgents = await selectMultipleOptions(
      rli,
      "meta_agents",
      WIZARD_PROMPTS.meta_agents.help,
      META_AGENT_PRESETS.map((m) => m.enabled_by_default),
    );
    answers.meta_agents = metaAgents.map((a) => a.value);

    // Primary model
    const primaryModel = await selectOption(
      rli,
      "primary_model",
      WIZARD_PROMPTS.primary_model.help,
    );
    answers.primary_model = primaryModel.value;

    // Research model
    const researchModel = await selectOption(
      rli,
      "research_model",
      WIZARD_PROMPTS.research_model.help,
    );
    answers.research_model = researchModel.value;

    // Settings
    const settings = await selectMultipleOptions(
      rli,
      "settings",
      WIZARD_PROMPTS.settings.help,
      SETTING_PRESETS.map((s) => s.enabled_by_default),
    );
    answers.settings = settings.map((s) => s.value);

    // Skills path (optional)
    const skillsPath = await askText(
      rli,
      "skills_path",
      WIZARD_PROMPTS.skills_path.default,
    );
    if (skillsPath) {
      answers.skills_path = skillsPath;
    }

    // Display summary
    console.log("");
    await showMessage(rli, "summary", answers);

    // Build config
    const config = buildConfig(answers);

    // Determine config path
    let configPath = options.configPath;
    if (!configPath) {
      const homeDir = process.env.HOME;
      if (homeDir) {
        configPath = path.join(homeDir, ".config", "opencode", "olimpus.jsonc");
      } else {
        throw new Error("HOME environment variable not set");
      }
    }

    // Create parent directories if needed
    const parentDir = path.dirname(configPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Write config
    const content = formatConfigAsJsonc(config);
    fs.writeFileSync(configPath, content, "utf-8");

    // Success message
    console.log("");
    await showMessage(rli, "success", configPath);

    return {
      config,
      answers,
      path: configPath,
    };
  } finally {
    rli.close();
  }
}

/**
 * Run wizard in non-interactive mode with preset answers
 * Useful for testing or automated setup
 */
export async function runWizardNonInteractive(
  presetAnswers: Partial<WizardAnswers>,
  options: WizardOptions = {},
): Promise<WizardResult> {
  const config = buildConfig({
    project_type: presetAnswers.project_type ?? "web",
    language: presetAnswers.language ?? "typescript",
    meta_agents: presetAnswers.meta_agents ?? ["atenea", "hermes", "hefesto"],
    primary_model: presetAnswers.primary_model ?? "claude-sonnet-4-20250217",
    research_model: presetAnswers.research_model ?? "claude-haiku-4-5",
    settings: presetAnswers.settings ?? [
      "background_parallelization",
      "adaptive_model_selection",
    ],
    skills_path: presetAnswers.skills_path,
  });

  let configPath = options.configPath;
  if (!configPath) {
    const homeDir = process.env.HOME;
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

  return {
    config,
    answers: presetAnswers as WizardAnswers,
    path: configPath,
  };
}
