/**
 * Main Configuration Editor
 *
 * Orchestrates all UI sections and manages configuration state.
 * Expanded to include meta-agent list, meta-agent form, routing rule list, and preview panel.
 */

import type { OlimpusConfig, MetaAgentDef } from "./types";
import { initializeMetaAgentList } from "./meta-agent-list";
import { initializeMetaAgentForm } from "./meta-agent-form";
import { initializeRuleList } from "./rule-list";
import { initializePreviewPanel } from "./preview-panel";
import { initializeProvidersForm } from "./providers-form";
import { initializeSettingsForm } from "./settings-form";
import { initializeAgents, initializeCategories, initializeSkills } from "./other-configs";
import defaultConfig from "./default-config";
import {
  downloadConfigAsFile,
  readConfigFromFile,
  copyShareUrl,
  getConfigFromUrl,
  updateUrlWithConfig,
} from "./config-io";

/**
 * Built-in agent names that can be delegation targets
 */
const BUILTIN_AGENTS = [
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
 * Current configuration state
 */
let currentConfig: OlimpusConfig = { ...defaultConfig };

/**
 * Validation result type
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Detect circular delegation in meta-agents
 *
 * @param config - The Olimpus configuration to validate
 * @returns Array of circular delegation paths found
 */
function detectCircularDelegation(config: OlimpusConfig): string[] {
  const metaAgents = config.meta_agents || {};
  const cycles: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  /**
   * Depth-first search to detect cycles
   */
  function findCycle(
    metaAgentName: string,
    path: string[],
  ): string | null {
    if (recursionStack.has(metaAgentName)) {
      // Cycle found - construct the cycle path
      const cycleStart = path.indexOf(metaAgentName);
      return path.slice(cycleStart).concat(metaAgentName).join(" → ");
    }

    if (visited.has(metaAgentName)) {
      return null; // Already checked, no cycle
    }

    visited.add(metaAgentName);
    recursionStack.add(metaAgentName);

    const metaAgent = metaAgents[metaAgentName];
    if (metaAgent) {
      for (const delegate of metaAgent.delegates_to || []) {
        // Only check other meta-agents, not built-in agents
        if (delegate in metaAgents) {
          const cycle = findCycle(delegate, [...path, metaAgentName]);
          if (cycle) {
            recursionStack.delete(metaAgentName);
            return cycle;
          }
        }
      }
    }

    recursionStack.delete(metaAgentName);
    return null;
  }

  // Check each meta-agent for cycles
  for (const name of Object.keys(metaAgents)) {
    visited.clear();
    recursionStack.clear();
    const cycle = findCycle(name, []);
    if (cycle) {
      cycles.push(cycle);
    }
  }

  return cycles;
}

/**
 * Validate a single meta-agent definition
 *
 * @param name - Meta-agent name
 * @param def - Meta-agent definition
 * @returns Validation result with errors and warnings
 */
function validateMetaAgentDef(
  name: string,
  def: MetaAgentDef,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!def.base_model || def.base_model.trim() === "") {
    errors.push(`Meta-agent "${name}": base_model is required`);
  }

  if (!def.delegates_to || def.delegates_to.length === 0) {
    errors.push(`Meta-agent "${name}": Must delegate to at least one agent`);
  }

  // Validate delegate targets
  for (const delegate of def.delegates_to || []) {
    if (!delegate || delegate.trim() === "") {
      errors.push(`Meta-agent "${name}": Delegate target cannot be empty`);
    }
  }

  // Validate temperature
  if (def.temperature !== undefined) {
    if (typeof def.temperature !== "number") {
      errors.push(`Meta-agent "${name}": Temperature must be a number`);
    } else if (def.temperature < 0 || def.temperature > 2) {
      warnings.push(
        `Meta-agent "${name}": Temperature should be between 0 and 2 (current: ${def.temperature})`,
      );
    }
  }

  // Validate routing rules
  if (def.routing_rules && def.routing_rules.length === 0) {
    warnings.push(`Meta-agent "${name}": No routing rules defined`);
  }

  for (let i = 0; i < (def.routing_rules || []).length; i++) {
    const rule = def.routing_rules[i];
    if (!rule.target_agent || rule.target_agent.trim() === "") {
      errors.push(`Meta-agent "${name}": Rule ${i + 1} missing target_agent`);
    }

    // Validate matcher
    if (!rule.matcher || !rule.matcher.type) {
      errors.push(`Meta-agent "${name}": Rule ${i + 1} missing matcher type`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate the entire Olimpus configuration
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 */
function validateConfig(config: OlimpusConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for circular delegation
  const cycles = detectCircularDelegation(config);
  if (cycles.length > 0) {
    errors.push(
      `Circular delegation detected: ${cycles.join("; ")}`,
    );
  }

  // Validate each meta-agent
  const metaAgents = config.meta_agents || {};
  for (const [name, def] of Object.entries(metaAgents)) {
    const result = validateMetaAgentDef(name, def);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Validate providers
  if (config.providers) {
    if (config.providers.priority_chain && config.providers.priority_chain.length === 0) {
      warnings.push("No providers in priority chain");
    }
  }

  // Validate settings
  if (config.settings) {
    if (config.settings.max_delegation_depth && config.settings.max_delegation_depth < 1) {
      errors.push("max_delegation_depth must be at least 1");
    }
    if (config.settings.max_delegation_depth && config.settings.max_delegation_depth > 10) {
      warnings.push("max_delegation_depth may be too high (recommended: 3-5)");
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Create a validation error toast notification
 *
 * @param message - The error message to display
 * @param type - The type of notification (error, warning, success)
 */
function showValidationNotification(
  message: string,
  type: "error" | "warning" | "success" = "error",
): void {
  // Remove existing notifications
  const existing = document.querySelectorAll(".validation-toast");
  existing.forEach((el) => el.remove());

  const toast = document.createElement("div");
  toast.className = `validation-toast validation-toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");

  const icon = type === "error" ? "⚠️" : type === "warning" ? "⚡" : "✓";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;

  // Add to body
  document.body.appendChild(toast);

  // Auto-remove after delay
  setTimeout(() => {
    toast.classList.add("toast-fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Create a validation error display for forms
 *
 * @param errors - Array of error messages
 * @param warnings - Array of warning messages
 * @returns The error display DOM element
 */
function createValidationDisplay(
  errors: string[],
  warnings: string[],
): HTMLElement {
  const container = document.createElement("div");
  container.className = "validation-display";

  if (errors.length > 0) {
    const errorSection = document.createElement("div");
    errorSection.className = "validation-errors";

    const errorHeader = document.createElement("div");
    errorHeader.className = "validation-header validation-header-error";
    errorHeader.innerHTML = `<span class="validation-header-icon">⚠️</span> Errors (${errors.length})`;
    errorSection.appendChild(errorHeader);

    const errorList = document.createElement("ul");
    errorList.className = "validation-list";
    errors.forEach((error) => {
      const li = document.createElement("li");
      li.className = "validation-item validation-item-error";
      li.textContent = error;
      errorList.appendChild(li);
    });
    errorSection.appendChild(errorList);
    container.appendChild(errorSection);
  }

  if (warnings.length > 0) {
    const warningSection = document.createElement("div");
    warningSection.className = "validation-warnings";

    const warningHeader = document.createElement("div");
    warningHeader.className = "validation-header validation-header-warning";
    warningHeader.innerHTML = `<span class="validation-header-icon">⚡</span> Warnings (${warnings.length})`;
    warningSection.appendChild(warningHeader);

    const warningList = document.createElement("ul");
    warningList.className = "validation-list";
    warnings.forEach((warning) => {
      const li = document.createElement("li");
      li.className = "validation-item validation-item-warning";
      li.textContent = warning;
      warningList.appendChild(li);
    });
    warningSection.appendChild(warningList);
    container.appendChild(warningSection);
  }

  return container;
}

/**
 * Update the validation status indicator in the header
 *
 * @param result - The validation result
 */
function updateValidationStatus(result: ValidationResult): void {
  const statusElement = document.getElementById("config-status");
  if (!statusElement) {
    return;
  }

  if (!result.isValid) {
    statusElement.innerHTML = `<span class="status-indicator status-indicator-error"></span>${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`;
    statusElement.title = result.errors.join("\n");
  } else if (result.warnings.length > 0) {
    statusElement.innerHTML = `<span class="status-indicator status-indicator-warning"></span>${result.warnings.length} warning${result.warnings.length !== 1 ? "s" : ""}`;
    statusElement.title = result.warnings.join("\n");
  } else {
    statusElement.innerHTML = '<span class="status-indicator status-indicator-ok"></span>Valid';
    statusElement.title = "";
  }
}

/**
 * Reference to the preview panel component
 */
let previewPanel: {
  update: (newConfig: OlimpusConfig) => void;
  updatePreview: () => void;
  setMetaAgent: (name: string | null) => void;
  getMetaAgent: () => string | null;
  destroy: () => void;
} | null = null;

/**
 * Handle configuration changes
 *
 * @param newConfig - The new configuration
 */
function handleConfigChange(newConfig: OlimpusConfig): void {
  currentConfig = newConfig;
  // Validate the new configuration
  const validationResult = validateConfig(newConfig);
  // Update validation status in header
  updateValidationStatus(validationResult);
  // Update URL with new config for sharing
  updateUrlWithConfig(newConfig);
  // Update preview panel with new config
  if (previewPanel) {
    previewPanel.update(newConfig);
  }
}

/**
 * Show meta-agent form for editing
 *
 * @param metaAgentName - The name of meta-agent to edit
 */
function showMetaAgentForm(metaAgentName: string): void {
  const metaAgents = currentConfig.meta_agents || {};
  const metaAgentDef = metaAgents[metaAgentName];

  if (!metaAgentDef) {
    showValidationNotification(`Meta-agent "${metaAgentName}" not found`, "error");
    return;
  }

  const listContainer = document.getElementById("meta-agents-list");
  const formContainer = document.getElementById("meta-agent-form-container");

  if (!listContainer || !formContainer) {
    showValidationNotification("Required containers not found", "error");
    return;
  }

  // Hide list, show form
  listContainer.classList.add("hidden");
  formContainer.classList.remove("hidden");

  const handleSave = (name: string, def: unknown): void => {
    const metaAgentDef = def as MetaAgentDef;

    // Validate the meta-agent definition before saving
    const validation = validateMetaAgentDef(name, metaAgentDef);

    if (!validation.isValid) {
      showValidationNotification(
        `Cannot save: ${validation.errors[0]}`,
        "error",
      );
      return;
    }

    // Check for circular delegation
    const testConfig = {
      ...currentConfig,
      meta_agents: {
        ...metaAgents,
        [name]: metaAgentDef,
      },
    };
    const cycles = detectCircularDelegation(testConfig);
    if (cycles.length > 0) {
      showValidationNotification(
        `Circular delegation detected: ${cycles[0]}`,
        "error",
      );
      return;
    }

    // If there are warnings, show them but allow saving
    if (validation.warnings.length > 0) {
      showValidationNotification(
        `Saved with warnings: ${validation.warnings[0]}`,
        "warning",
      );
    }

    currentConfig = {
      ...currentConfig,
      meta_agents: {
        ...metaAgents,
        [name]: metaAgentDef,
      },
    };
    handleConfigChange(currentConfig);
    showValidationNotification("Meta-agent saved successfully", "success");
    hideMetaAgentForm();
  };

  const handleCancel = (): void => {
    hideMetaAgentForm();
  };

  const form = initializeMetaAgentForm(
    metaAgentName,
    metaAgentDef,
    handleSave,
    handleCancel,
  );
}

/**
 * Hide meta-agent form and return to list view
 */
function hideMetaAgentForm(): void {
  const listContainer = document.getElementById("meta-agents-list");
  const formContainer = document.getElementById("meta-agent-form-container");

  if (listContainer) {
    listContainer.classList.remove("hidden");
  }
  if (formContainer) {
    formContainer.classList.add("hidden");
    formContainer.innerHTML = "";
  }
}

/**
 * Handle rule editing
 *
 * @param metaAgentName - The name of the meta-agent
 * @param ruleIndex - The index of the rule to edit
 */
function handleEditRule(metaAgentName: string, ruleIndex: number): void {
  // TODO: Implement rule editing in later subtasks
  showValidationNotification(
    `Edit rule ${ruleIndex + 1} for ${metaAgentName} (to be implemented)`,
    "warning",
  );
}

/**
 * Switch to a configuration panel
 *
 * @param sectionId - The ID of the section to switch to (without "panel-" prefix)
 */
function switchPanel(sectionId: string): void {
  // Update tab active states
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    const tabSection = tab.getAttribute("data-section");
    if (tabSection === sectionId) {
      tab.classList.add("nav-tab-active");
      tab.setAttribute("aria-selected", "true");
    } else {
      tab.classList.remove("nav-tab-active");
      tab.setAttribute("aria-selected", "false");
    }
  });

  // Update panel visibility
  const panels = document.querySelectorAll(".config-panel");
  panels.forEach((panel) => {
    if (panel.id === `panel-${sectionId}`) {
      panel.classList.add("panel-active");
    } else {
      panel.classList.remove("panel-active");
    }
  });
}

/**
 * Load configuration from URL if present
 *
 * @returns true if config was loaded from URL, false otherwise
 */
function loadConfigFromUrl(): boolean {
  try {
    const urlConfig = getConfigFromUrl();
    if (urlConfig) {
      currentConfig = urlConfig;
      return true;
    }
    return false;
  } catch {
    // If URL config is invalid, use default config
    return false;
  }
}

/**
 * Initialize the configuration editor
 */
export function initializeConfigEditor(): void {
  // Load config from URL if present
  const loadedFromUrl = loadConfigFromUrl();

  // Validate initial configuration and update status
  const validation = validateConfig(currentConfig);
  updateValidationStatus(validation);

  // Show notification if config was loaded from URL
  if (loadedFromUrl) {
    const statusElement = document.getElementById("config-status");
    if (statusElement) {
      const isValid = validation.isValid;
      const iconClass = isValid
        ? "status-indicator-ok"
        : validation.errors.length > 0
          ? "status-indicator-error"
          : "status-indicator-warning";
      const message = isValid
        ? "Config loaded from URL"
        : validation.errors.length > 0
          ? `Config loaded from URL (${validation.errors.length} error${validation.errors.length !== 1 ? "s" : ""})`
          : `Config loaded from URL (${validation.warnings.length} warning${validation.warnings.length !== 1 ? "s" : ""})`;
      statusElement.innerHTML = `<span class="status-indicator ${iconClass}"></span>${message}`;
    }
  }

  // Initialize navigation tabs
  const navTabs = document.querySelectorAll(".nav-tab");
  navTabs.forEach((tab) => {
    tab.addEventListener("click", (): void => {
      const sectionId = tab.getAttribute("data-section");
      if (sectionId) {
        switchPanel(sectionId);
      }
    });
  });

  // Initialize meta-agent list
  const metaAgentList = initializeMetaAgentList(
    currentConfig,
    handleConfigChange,
  );

  // Initialize routing rule list
  const ruleList = initializeRuleList(
    currentConfig,
    null, // No meta-agent selected initially
    handleConfigChange,
    handleEditRule,
  );

  // Initialize preview panel
  previewPanel = initializePreviewPanel(
    currentConfig,
    handleConfigChange,
  );

  // Initialize providers form
  const providersForm = initializeProvidersForm(
    currentConfig.providers ?? {},
    (providers) => {
      currentConfig = {
        ...currentConfig,
        providers,
      };
      handleConfigChange(currentConfig);
    },
  );

  // Initialize settings form
  const settingsForm = initializeSettingsForm(
    currentConfig.settings ?? {},
    (settings) => {
      currentConfig = {
        ...currentConfig,
        settings,
      };
      handleConfigChange(currentConfig);
    },
  );

  // Initialize agents configuration
  const agentsConfig = initializeAgents(
    currentConfig.agents ?? {},
    (agents) => {
      currentConfig = {
        ...currentConfig,
        agents,
      };
      handleConfigChange(currentConfig);
    },
  );

  // Initialize categories configuration
  const categoriesConfig = initializeCategories(
    currentConfig.categories ?? {},
    (categories) => {
      currentConfig = {
        ...currentConfig,
        categories,
      };
      handleConfigChange(currentConfig);
    },
  );

  // Initialize skills configuration
  const skillsConfig = initializeSkills(
    currentConfig.skills ?? [],
    (skills) => {
      currentConfig = {
        ...currentConfig,
        skills,
      };
      handleConfigChange(currentConfig);
    },
  );

  // Update rule list and current config when meta-agent changes
  // Preview is updated via handleConfigChange
  const originalUpdate = metaAgentList.update;
  metaAgentList.update = (newConfig: OlimpusConfig): void => {
    originalUpdate(newConfig);
    currentConfig = newConfig;
    ruleList.update(newConfig);
    providersForm.update(newConfig.providers ?? {});
    settingsForm.update(newConfig.settings ?? {});
    agentsConfig.update(newConfig.agents ?? {});
    categoriesConfig.update(newConfig.categories ?? {});
    skillsConfig.update(newConfig.skills ?? []);
    // handleConfigChange will update preview panel
  };

  // Initialize import/export functionality
  const exportButton = document.getElementById("btn-export");
  if (exportButton) {
    exportButton.addEventListener("click", (): void => {
      try {
        downloadConfigAsFile(currentConfig, "olimpus.jsonc");
        showValidationNotification("Configuration exported successfully", "success");
      } catch (error) {
        showValidationNotification(
          `Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`,
          "error",
        );
      }
    });
  }

  const importButton = document.getElementById("btn-import");
  const importFileInput = document.getElementById("import-file-input");
  if (importButton && importFileInput) {
    importButton.addEventListener("click", (): void => {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", async (event: Event): Promise<void> => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const importedConfig = await readConfigFromFile(file);

        // Validate imported configuration
        const validation = validateConfig(importedConfig);

        if (!validation.isValid) {
          showValidationNotification(
            `Import failed: ${validation.errors[0]}`,
            "error",
          );
          return;
        }

        // Check for circular delegation
        const cycles = detectCircularDelegation(importedConfig);
        if (cycles.length > 0) {
          showValidationNotification(
            `Circular delegation detected: ${cycles[0]}`,
            "error",
          );
          return;
        }

        currentConfig = importedConfig;
        handleConfigChange(currentConfig);
        metaAgentList.update(currentConfig);
        ruleList.update(currentConfig);
        providersForm.update(currentConfig.providers ?? {});
        settingsForm.update(currentConfig.settings ?? {});
        agentsConfig.update(currentConfig.agents ?? {});
        categoriesConfig.update(currentConfig.categories ?? {});
        skillsConfig.update(currentConfig.skills ?? []);

        if (validation.warnings.length > 0) {
          showValidationNotification(
            `Configuration imported with ${validation.warnings.length} warning${validation.warnings.length !== 1 ? "s" : ""}`,
            "warning",
          );
        } else {
          showValidationNotification("Configuration imported successfully", "success");
        }
      } catch (error) {
        showValidationNotification(
          `Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`,
          "error",
        );
      } finally {
        // Reset file input to allow importing the same file again
        target.value = "";
      }
    });
  }

  const shareButton = document.getElementById("btn-share");
  if (shareButton) {
    shareButton.addEventListener("click", async (): Promise<void> => {
      try {
        await copyShareUrl(currentConfig);
        showValidationNotification("Share URL copied to clipboard!", "success");
      } catch (error) {
        showValidationNotification(
          `Failed to copy share URL: ${error instanceof Error ? error.message : String(error)}`,
          "error",
        );
      }
    });
  }

  // TODO: Initialize other sections in later subtasks

  // Make functions available globally for testing
  (window as any).showMetaAgentForm = showMetaAgentForm;
  (window as any).hideMetaAgentForm = hideMetaAgentForm;
  (window as any).handleEditRule = handleEditRule;
  (window as any).ruleList = ruleList;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeConfigEditor);
} else {
  initializeConfigEditor();
}
