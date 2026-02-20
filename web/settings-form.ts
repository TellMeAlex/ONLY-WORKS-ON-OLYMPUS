/**
 * Settings Form Component
 *
 * Handles the form for editing global settings including
 * namespace, delegation, parallelization, model selection, and routing logger configuration.
 */

import type {
  Settings,
  BackgroundParallelization,
  AdaptiveModelSelection,
  RoutingLoggerConfig,
} from "./types";

/**
 * Default values for settings
 */
const DEFAULT_SETTINGS: Settings = {
  namespace_prefix: "olimpus",
  max_delegation_depth: 3,
  background_parallelization: {
    enabled: true,
    max_parallel_tasks: 3,
    timeout_ms: 30000,
  },
  adaptive_model_selection: {
    enabled: true,
    research_model: "claude-haiku-4-5",
    strategy_model: "claude-opus-4-6",
    default_model: "claude-3-5-sonnet-20241022",
  },
  ultrawork_enabled: true,
  todo_continuation: true,
  verify_before_completion: true,
  lsp_refactoring_preferred: true,
  aggressive_comment_pruning: true,
};

/**
 * Create a form group with label and input
 *
 * @param labelText - The label text
 * @param inputElement - The input element
 * @param helpText - Optional help text
 * @returns The form group DOM element
 */
function createFormGroup(
  labelText: string,
  inputElement: HTMLInputElement | HTMLSelectElement,
  helpText?: string,
): HTMLElement {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.textContent = labelText;
  label.setAttribute("for", inputElement.id);

  group.appendChild(label);
  group.appendChild(inputElement);

  if (helpText) {
    const help = document.createElement("div");
    help.className = "form-help";
    help.textContent = helpText;
    group.appendChild(help);
  }

  return group;
}

/**
 * Create a section header for grouping related settings
 *
 * @param title - The section title
 * @returns The section header DOM element
 */
function createSectionHeader(title: string): HTMLElement {
  const header = document.createElement("div");
  header.className = "settings-section-header";
  header.textContent = title;
  return header;
}

/**
 * Create a background parallelization settings section
 *
 * @param config - Current background parallelization config
 * @param onChange - Callback when config changes
 * @returns The DOM element
 */
function createBackgroundParallelizationSection(
  config: BackgroundParallelization,
  onChange: (config: BackgroundParallelization) => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "settings-section";

  const defaultConfig = DEFAULT_SETTINGS.background_parallelization!;
  const bgConfig = {
    enabled: config.enabled ?? defaultConfig.enabled,
    max_parallel_tasks: config.max_parallel_tasks ?? defaultConfig.max_parallel_tasks,
    timeout_ms: config.timeout_ms ?? defaultConfig.timeout_ms,
  };

  // Enabled checkbox
  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.id = "bg-parallelization-enabled";
  enabledInput.checked = bgConfig.enabled;
  enabledInput.addEventListener("change", () => {
    onChange({
      ...bgConfig,
      enabled: enabledInput.checked,
    });
  });

  const enabledGroup = document.createElement("div");
  enabledGroup.className = "form-group form-group-checkbox";
  enabledGroup.appendChild(enabledInput);
  const enabledLabel = document.createElement("label");
  enabledLabel.textContent = "Enable Background Parallelization";
  enabledLabel.setAttribute("for", enabledInput.id);
  enabledGroup.appendChild(enabledLabel);
  const enabledHelp = document.createElement("div");
  enabledHelp.className = "form-help";
  enabledHelp.textContent = "Fire background researchers while main agent executes";
  enabledGroup.appendChild(enabledHelp);
  container.appendChild(enabledGroup);

  // Max parallel tasks
  const maxTasksInput = document.createElement("input");
  maxTasksInput.type = "number";
  maxTasksInput.id = "bg-parallelization-max-tasks";
  maxTasksInput.min = "1";
  maxTasksInput.max = "10";
  maxTasksInput.value = String(bgConfig.max_parallel_tasks);
  maxTasksInput.addEventListener("input", () => {
    const value = parseInt(maxTasksInput.value, 10);
    if (!isNaN(value) && value > 0) {
      onChange({
        ...bgConfig,
        max_parallel_tasks: value,
      });
    }
  });

  const maxTasksGroup = createFormGroup(
    "Max Parallel Tasks",
    maxTasksInput,
    "Maximum number of background tasks to run simultaneously",
  );
  container.appendChild(maxTasksGroup);

  // Timeout
  const timeoutInput = document.createElement("input");
  timeoutInput.type = "number";
  timeoutInput.id = "bg-parallelization-timeout";
  timeoutInput.min = "1000";
  timeoutInput.step = "1000";
  timeoutInput.value = String(bgConfig.timeout_ms);
  timeoutInput.addEventListener("input", () => {
    const value = parseInt(timeoutInput.value, 10);
    if (!isNaN(value) && value > 0) {
      onChange({
        ...bgConfig,
        timeout_ms: value,
      });
    }
  });

  const timeoutGroup = createFormGroup(
    "Timeout (ms)",
    timeoutInput,
    "Maximum time to wait for background tasks to complete",
  );
  container.appendChild(timeoutGroup);

  return container;
}

/**
 * Create an adaptive model selection settings section
 *
 * @param config - Current adaptive model selection config
 * @param onChange - Callback when config changes
 * @returns The DOM element
 */
function createAdaptiveModelSelectionSection(
  config: AdaptiveModelSelection,
  onChange: (config: AdaptiveModelSelection) => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "settings-section";

  const defaultConfig = DEFAULT_SETTINGS.adaptive_model_selection!;
  const amsConfig = {
    enabled: config.enabled ?? defaultConfig.enabled,
    research_model: config.research_model ?? defaultConfig.research_model,
    strategy_model: config.strategy_model ?? defaultConfig.strategy_model,
    default_model: config.default_model ?? defaultConfig.default_model,
  };

  // Enabled checkbox
  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.id = "adaptive-model-enabled";
  enabledInput.checked = amsConfig.enabled;
  enabledInput.addEventListener("change", () => {
    onChange({
      ...amsConfig,
      enabled: enabledInput.checked,
    });
  });

  const enabledGroup = document.createElement("div");
  enabledGroup.className = "form-group form-group-checkbox";
  enabledGroup.appendChild(enabledInput);
  const enabledLabel = document.createElement("label");
  enabledLabel.textContent = "Enable Adaptive Model Selection";
  enabledLabel.setAttribute("for", enabledInput.id);
  enabledGroup.appendChild(enabledLabel);
  const enabledHelp = document.createElement("div");
  enabledHelp.className = "form-help";
  enabledHelp.textContent = "Use different models for different task types";
  enabledGroup.appendChild(enabledHelp);
  container.appendChild(enabledGroup);

  // Research model
  const researchModelInput = document.createElement("input");
  researchModelInput.type = "text";
  researchModelInput.id = "adaptive-model-research";
  researchModelInput.value = amsConfig.research_model;
  researchModelInput.addEventListener("input", () => {
    onChange({
      ...amsConfig,
      research_model: researchModelInput.value,
    });
  });

  const researchModelGroup = createFormGroup(
    "Research Model",
    researchModelInput,
    "Cheap model used for background research and search tasks",
  );
  container.appendChild(researchModelGroup);

  // Strategy model
  const strategyModelInput = document.createElement("input");
  strategyModelInput.type = "text";
  strategyModelInput.id = "adaptive-model-strategy";
  strategyModelInput.value = amsConfig.strategy_model;
  strategyModelInput.addEventListener("input", () => {
    onChange({
      ...amsConfig,
      strategy_model: strategyModelInput.value,
    });
  });

  const strategyModelGroup = createFormGroup(
    "Strategy Model",
    strategyModelInput,
    "Expensive model used for strategic decisions and complex analysis",
  );
  container.appendChild(strategyModelGroup);

  // Default model
  const defaultModelInput = document.createElement("input");
  defaultModelInput.type = "text";
  defaultModelInput.id = "adaptive-model-default";
  defaultModelInput.value = amsConfig.default_model;
  defaultModelInput.addEventListener("input", () => {
    onChange({
      ...amsConfig,
      default_model: defaultModelInput.value,
    });
  });

  const defaultModelGroup = createFormGroup(
    "Default Model",
    defaultModelInput,
    "Model used when no specific task type is detected",
  );
  container.appendChild(defaultModelGroup);

  return container;
}

/**
 * Create a routing logger settings section
 *
 * @param config - Current routing logger config
 * @param onChange - Callback when config changes
 * @returns The DOM element
 */
function createRoutingLoggerSection(
  config: RoutingLoggerConfig | undefined,
  onChange: (config: RoutingLoggerConfig | undefined) => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "settings-section";

  const defaultConfig: RoutingLoggerConfig = {
    enabled: false,
    output: "disabled",
    log_file: undefined,
    debug_mode: false,
  };

  const loggerConfig = config ? {
    enabled: config.enabled ?? defaultConfig.enabled,
    output: config.output ?? defaultConfig.output,
    log_file: config.log_file ?? defaultConfig.log_file,
    debug_mode: config.debug_mode ?? defaultConfig.debug_mode,
  } : defaultConfig;

  // Enabled checkbox
  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.id = "routing-logger-enabled";
  enabledInput.checked = loggerConfig.enabled;
  enabledInput.addEventListener("change", () => {
    if (enabledInput.checked) {
      onChange({
        ...loggerConfig,
        enabled: true,
      });
    } else {
      onChange(undefined);
    }
  });

  const enabledGroup = document.createElement("div");
  enabledGroup.className = "form-group form-group-checkbox";
  enabledGroup.appendChild(enabledInput);
  const enabledLabel = document.createElement("label");
  enabledLabel.textContent = "Enable Routing Logger";
  enabledLabel.setAttribute("for", enabledInput.id);
  enabledGroup.appendChild(enabledLabel);
  const enabledHelp = document.createElement("div");
  enabledHelp.className = "form-help";
  enabledHelp.textContent = "Log routing decisions for debugging";
  enabledGroup.appendChild(enabledHelp);
  container.appendChild(enabledGroup);

  // Output mode select
  const outputSelect = document.createElement("select");
  outputSelect.id = "routing-logger-output";
  outputSelect.className = "form-group-select";
  const options = [
    { value: "console", label: "Console" },
    { value: "file", label: "File" },
    { value: "disabled", label: "Disabled" },
  ];
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === loggerConfig.output) {
      option.selected = true;
    }
    outputSelect.appendChild(option);
  });
  outputSelect.addEventListener("change", () => {
    onChange({
      ...loggerConfig,
      output: outputSelect.value as RoutingLoggerConfig["output"],
    });
  });

  const outputGroup = createFormGroup(
    "Output Destination",
    outputSelect,
    "Where routing logs should be written",
  );
  container.appendChild(outputGroup);

  // Log file path
  const logFileInput = document.createElement("input");
  logFileInput.type = "text";
  logFileInput.id = "routing-logger-file";
  logFileInput.value = loggerConfig.log_file || "";
  logFileInput.addEventListener("input", () => {
    const value = logFileInput.value.trim();
    onChange({
      ...loggerConfig,
      log_file: value === "" ? undefined : value,
    });
  });

  const logFileGroup = createFormGroup(
    "Log File Path",
    logFileInput,
    "Path to log file (required if output is 'file')",
  );
  container.appendChild(logFileGroup);

  // Debug mode checkbox
  const debugInput = document.createElement("input");
  debugInput.type = "checkbox";
  debugInput.id = "routing-logger-debug";
  debugInput.checked = loggerConfig.debug_mode;
  debugInput.addEventListener("change", () => {
    onChange({
      ...loggerConfig,
      debug_mode: debugInput.checked,
    });
  });

  const debugGroup = document.createElement("div");
  debugGroup.className = "form-group form-group-checkbox";
  debugGroup.appendChild(debugInput);
  const debugLabel = document.createElement("label");
  debugLabel.textContent = "Debug Mode";
  debugLabel.setAttribute("for", debugInput.id);
  debugGroup.appendChild(debugLabel);
  const debugHelp = document.createElement("div");
  debugHelp.className = "form-help";
  debugHelp.textContent = "Include detailed matcher evaluation results";
  debugGroup.appendChild(debugHelp);
  container.appendChild(debugGroup);

  return container;
}

/**
 * Create the settings form DOM element
 *
 * @param settings - Current settings configuration
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
export function createSettingsForm(
  settings: Settings,
  onChange: (config: Settings) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "settings-form";
  form.addEventListener("submit", (e) => e.preventDefault());

  const config = {
    namespace_prefix: settings.namespace_prefix ?? DEFAULT_SETTINGS.namespace_prefix,
    max_delegation_depth: settings.max_delegation_depth ?? DEFAULT_SETTINGS.max_delegation_depth,
    background_parallelization: settings.background_parallelization ?? DEFAULT_SETTINGS.background_parallelization,
    adaptive_model_selection: settings.adaptive_model_selection ?? DEFAULT_SETTINGS.adaptive_model_selection,
    ultrawork_enabled: settings.ultrawork_enabled ?? DEFAULT_SETTINGS.ultrawork_enabled,
    todo_continuation: settings.todo_continuation ?? DEFAULT_SETTINGS.todo_continuation,
    verify_before_completion: settings.verify_before_completion ?? DEFAULT_SETTINGS.verify_before_completion,
    lsp_refactoring_preferred: settings.lsp_refactoring_preferred ?? DEFAULT_SETTINGS.lsp_refactoring_preferred,
    aggressive_comment_pruning: settings.aggressive_comment_pruning ?? DEFAULT_SETTINGS.aggressive_comment_pruning,
    routing_logger: settings.routing_logger,
  };

  // Namespace prefix
  const namespaceInput = document.createElement("input");
  namespaceInput.type = "text";
  namespaceInput.id = "settings-namespace";
  namespaceInput.value = config.namespace_prefix;
  namespaceInput.addEventListener("input", () => {
    onChange({
      ...config,
      namespace_prefix: namespaceInput.value,
    });
  });

  const namespaceGroup = createFormGroup(
    "Namespace Prefix",
    namespaceInput,
    "Prefix for bundled skills (default: 'olimpus')",
  );
  form.appendChild(namespaceGroup);

  // Max delegation depth
  const maxDepthInput = document.createElement("input");
  maxDepthInput.type = "number";
  maxDepthInput.id = "settings-max-depth";
  maxDepthInput.min = "1";
  maxDepthInput.max = "10";
  maxDepthInput.value = String(config.max_delegation_depth);
  maxDepthInput.addEventListener("input", () => {
    const value = parseInt(maxDepthInput.value, 10);
    if (!isNaN(value) && value > 0) {
      onChange({
        ...config,
        max_delegation_depth: value,
      });
    }
  });

  const maxDepthGroup = createFormGroup(
    "Max Delegation Depth",
    maxDepthInput,
    "Prevents infinite delegation chains",
  );
  form.appendChild(maxDepthGroup);

  // Background Parallelization section
  form.appendChild(createSectionHeader("Background Parallelization"));
  form.appendChild(
    createBackgroundParallelizationSection(
      config.background_parallelization!,
      (bgConfig) => {
        onChange({
          ...config,
          background_parallelization: bgConfig,
        });
      },
    ),
  );

  // Adaptive Model Selection section
  form.appendChild(createSectionHeader("Adaptive Model Selection"));
  form.appendChild(
    createAdaptiveModelSelectionSection(
      config.adaptive_model_selection!,
      (amsConfig) => {
        onChange({
          ...config,
          adaptive_model_selection: amsConfig,
        });
      },
    ),
  );

  // Ultrawork settings
  form.appendChild(createSectionHeader("Ultrawork Settings"));

  const ultraworkEnabledInput = document.createElement("input");
  ultraworkEnabledInput.type = "checkbox";
  ultraworkEnabledInput.id = "settings-ultrawork-enabled";
  ultraworkEnabledInput.checked = config.ultrawork_enabled;
  ultraworkEnabledInput.addEventListener("change", () => {
    onChange({
      ...config,
      ultrawork_enabled: ultraworkEnabledInput.checked,
    });
  });

  const ultraworkEnabledGroup = document.createElement("div");
  ultraworkEnabledGroup.className = "form-group form-group-checkbox";
  ultraworkEnabledGroup.appendChild(ultraworkEnabledInput);
  const ultraworkEnabledLabel = document.createElement("label");
  ultraworkEnabledLabel.textContent = "Ultrawork Enabled";
  ultraworkEnabledLabel.setAttribute("for", ultraworkEnabledInput.id);
  ultraworkEnabledGroup.appendChild(ultraworkEnabledLabel);
  const ultraworkEnabledHelp = document.createElement("div");
  ultraworkEnabledHelp.className = "form-help";
  ultraworkEnabledHelp.textContent = "Activate relentless execution mode when 'ultrawork' or 'ulw' is in prompt";
  ultraworkEnabledGroup.appendChild(ultraworkEnabledHelp);
  form.appendChild(ultraworkEnabledGroup);

  const todoContinuationInput = document.createElement("input");
  todoContinuationInput.type = "checkbox";
  todoContinuationInput.id = "settings-todo-continuation";
  todoContinuationInput.checked = config.todo_continuation;
  todoContinuationInput.addEventListener("change", () => {
    onChange({
      ...config,
      todo_continuation: todoContinuationInput.checked,
    });
  });

  const todoContinuationGroup = document.createElement("div");
  todoContinuationGroup.className = "form-group form-group-checkbox";
  todoContinuationGroup.appendChild(todoContinuationInput);
  const todoContinuationLabel = document.createElement("label");
  todoContinuationLabel.textContent = "Todo Continuation";
  todoContinuationLabel.setAttribute("for", todoContinuationInput.id);
  todoContinuationGroup.appendChild(todoContinuationLabel);
  const todoContinuationHelp = document.createElement("div");
  todoContinuationHelp.className = "form-help";
  todoContinuationHelp.textContent = "Tasks don't stop halfway - continue until completion";
  todoContinuationGroup.appendChild(todoContinuationHelp);
  form.appendChild(todoContinuationGroup);

  const verifyBeforeCompletionInput = document.createElement("input");
  verifyBeforeCompletionInput.type = "checkbox";
  verifyBeforeCompletionInput.id = "settings-verify-before-completion";
  verifyBeforeCompletionInput.checked = config.verify_before_completion;
  verifyBeforeCompletionInput.addEventListener("change", () => {
    onChange({
      ...config,
      verify_before_completion: verifyBeforeCompletionInput.checked,
    });
  });

  const verifyBeforeCompletionGroup = document.createElement("div");
  verifyBeforeCompletionGroup.className = "form-group form-group-checkbox";
  verifyBeforeCompletionGroup.appendChild(verifyBeforeCompletionInput);
  const verifyBeforeCompletionLabel = document.createElement("label");
  verifyBeforeCompletionLabel.textContent = "Verify Before Completion";
  verifyBeforeCompletionLabel.setAttribute("for", verifyBeforeCompletionInput.id);
  verifyBeforeCompletionGroup.appendChild(verifyBeforeCompletionLabel);
  const verifyBeforeCompletionHelp = document.createElement("div");
  verifyBeforeCompletionHelp.className = "form-help";
  verifyBeforeCompletionHelp.textContent = "Verify work before marking tasks as complete";
  verifyBeforeCompletionGroup.appendChild(verifyBeforeCompletionHelp);
  form.appendChild(verifyBeforeCompletionGroup);

  // Code quality settings
  form.appendChild(createSectionHeader("Code Quality"));

  const lspRefactoringInput = document.createElement("input");
  lspRefactoringInput.type = "checkbox";
  lspRefactoringInput.id = "settings-lsp-refactoring";
  lspRefactoringInput.checked = config.lsp_refactoring_preferred;
  lspRefactoringInput.addEventListener("change", () => {
    onChange({
      ...config,
      lsp_refactoring_preferred: lspRefactoringInput.checked,
    });
  });

  const lspRefactoringGroup = document.createElement("div");
  lspRefactoringGroup.className = "form-group form-group-checkbox";
  lspRefactoringGroup.appendChild(lspRefactoringInput);
  const lspRefactoringLabel = document.createElement("label");
  lspRefactoringLabel.textContent = "LSP Refactoring Preferred";
  lspRefactoringLabel.setAttribute("for", lspRefactoringInput.id);
  lspRefactoringGroup.appendChild(lspRefactoringLabel);
  const lspRefactoringHelp = document.createElement("div");
  lspRefactoringHelp.className = "form-help";
  lspRefactoringHelp.textContent = "Use AST-based refactoring instead of string replacement";
  lspRefactoringGroup.appendChild(lspRefactoringHelp);
  form.appendChild(lspRefactoringGroup);

  const aggressiveCommentPruningInput = document.createElement("input");
  aggressiveCommentPruningInput.type = "checkbox";
  aggressiveCommentPruningInput.id = "settings-comment-pruning";
  aggressiveCommentPruningInput.checked = config.aggressive_comment_pruning;
  aggressiveCommentPruningInput.addEventListener("change", () => {
    onChange({
      ...config,
      aggressive_comment_pruning: aggressiveCommentPruningInput.checked,
    });
  });

  const aggressiveCommentPruningGroup = document.createElement("div");
  aggressiveCommentPruningGroup.className = "form-group form-group-checkbox";
  aggressiveCommentPruningGroup.appendChild(aggressiveCommentPruningInput);
  const aggressiveCommentPruningLabel = document.createElement("label");
  aggressiveCommentPruningLabel.textContent = "Aggressive Comment Pruning";
  aggressiveCommentPruningLabel.setAttribute("for", aggressiveCommentPruningInput.id);
  aggressiveCommentPruningGroup.appendChild(aggressiveCommentPruningLabel);
  const aggressiveCommentPruningHelp = document.createElement("div");
  aggressiveCommentPruningHelp.className = "form-help";
  aggressiveCommentPruningHelp.textContent = "Remove unnecessary comments from generated code";
  aggressiveCommentPruningGroup.appendChild(aggressiveCommentPruningHelp);
  form.appendChild(aggressiveCommentPruningGroup);

  // Routing Logger section
  form.appendChild(createSectionHeader("Routing Logger"));
  form.appendChild(
    createRoutingLoggerSection(
      config.routing_logger,
      (loggerConfig) => {
        onChange({
          ...config,
          routing_logger: loggerConfig,
        });
      },
    ),
  );

  return form;
}

/**
 * Validate a settings configuration
 *
 * @param settings - The settings to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateSettings(
  settings: Settings,
): { isValid: boolean; error?: string } {
  // Settings can be partial, so we only validate what's provided
  if (!settings) {
    return { isValid: true };
  }

  // Validate max_delegation_depth
  if (settings.max_delegation_depth !== undefined) {
    if (
      typeof settings.max_delegation_depth !== "number" ||
      settings.max_delegation_depth < 1 ||
      settings.max_delegation_depth > 10
    ) {
      return {
        isValid: false,
        error: "Max delegation depth must be between 1 and 10",
      };
    }
  }

  // Validate namespace_prefix if provided
  if (settings.namespace_prefix !== undefined && settings.namespace_prefix === "") {
    return {
      isValid: false,
      error: "Namespace prefix cannot be empty",
    };
  }

  // Validate background_parallelization
  if (settings.background_parallelization) {
    const bg = settings.background_parallelization;
    if (bg.max_parallel_tasks !== undefined && bg.max_parallel_tasks < 1) {
      return {
        isValid: false,
        error: "Max parallel tasks must be at least 1",
      };
    }
    if (bg.timeout_ms !== undefined && bg.timeout_ms < 100) {
      return {
        isValid: false,
        error: "Timeout must be at least 100ms",
      };
    }
  }

  // Validate adaptive_model_selection
  if (settings.adaptive_model_selection) {
    const ams = settings.adaptive_model_selection;
    if (ams.research_model !== undefined && ams.research_model === "") {
      return {
        isValid: false,
        error: "Research model cannot be empty",
      };
    }
    if (ams.strategy_model !== undefined && ams.strategy_model === "") {
      return {
        isValid: false,
        error: "Strategy model cannot be empty",
      };
    }
    if (ams.default_model !== undefined && ams.default_model === "") {
      return {
        isValid: false,
        error: "Default model cannot be empty",
      };
    }
  }

  return { isValid: true };
}

/**
 * Render a settings form into a container
 *
 * @param container - The container element to render into
 * @param settings - Current settings configuration
 * @param onChange - Callback when form data changes
 */
export function renderSettingsForm(
  container: HTMLElement,
  settings: Settings,
  onChange: (config: Settings) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  container.innerHTML = "";
  const form = createSettingsForm(settings, onChange);
  container.appendChild(form);
}

/**
 * Initialize a settings form
 *
 * @param settings - Current settings configuration
 * @param onChange - Callback when form data changes
 * @returns Object with update/destroy methods
 */
export function initializeSettingsForm(
  settings: Settings,
  onChange: (config: Settings) => void,
): {
  update: (config: Settings) => void;
  destroy: () => void;
  getValue: () => Settings;
} {
  const container = document.getElementById("settings-form");

  if (!container) {
    throw new Error("Settings form container not found");
  }

  let currentSettings: Settings = { ...settings };

  const handleOnChange = (updatedSettings: Settings): void => {
    currentSettings = updatedSettings;
    onChange(updatedSettings);
  };

  const render = (): void => {
    container.innerHTML = "";
    const form = createSettingsForm(currentSettings, handleOnChange);
    container.appendChild(form);
  };

  render();

  return {
    update: (newSettings: Settings): void => {
      currentSettings = { ...newSettings };
      render();
    },
    destroy: (): void => {
      container.innerHTML = "";
    },
    getValue: (): Settings => ({ ...currentSettings }),
  };
}
