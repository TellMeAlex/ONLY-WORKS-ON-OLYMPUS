/**
 * Preview Panel Component
 *
 * Provides live preview of routing behavior by testing sample prompts
 * against the configured meta-agent routing rules.
 */

import type { OlimpusConfig, MetaAgentDef, RoutingRule } from "./types";
import {
  evaluateRoutingRules,
  getMatchedContent,
  type RoutingContext,
  type ResolvedRoute,
} from "./matcher-evaluator";

/**
 * Preview result data structure
 */
export interface PreviewResult {
  matched: boolean;
  metaAgent?: string;
  targetAgent?: string;
  matchedRule?: RoutingRule;
  matchedReason?: string;
  configOverrides?: {
    model?: string;
    temperature?: number;
    prompt?: string;
    variant?: string;
  };
}

/**
 * Get all available meta-agents from config
 *
 * @param config - The Olimpus configuration
 * @returns Array of meta-agent names
 */
export function getMetaAgentNames(config: OlimpusConfig): string[] {
  return Object.keys(config.meta_agents || {});
}

/**
 * Evaluate a prompt against a specific meta-agent's routing rules
 *
 * @param metaAgent - The meta-agent definition
 * @param prompt - The sample prompt to test
 * @param projectFiles - Optional project files for project_context matcher
 * @param projectDeps - Optional project dependencies for project_context matcher
 * @returns The preview result
 */
export function evaluatePreview(
  metaAgent: MetaAgentDef,
  prompt: string,
  projectFiles?: string[],
  projectDeps?: string[],
): PreviewResult {
  const routingRules = metaAgent.routing_rules || [];

  if (routingRules.length === 0) {
    return {
      matched: false,
      matchedReason: "No routing rules defined",
    };
  }

  const context: RoutingContext = {
    prompt,
    projectFiles,
    projectDeps,
  };

  const resolvedRoute = evaluateRoutingRules(routingRules, context);

  if (!resolvedRoute) {
    return {
      matched: false,
      matchedReason: "No matching rule found",
    };
  }

  // Find the matched rule
  for (const rule of routingRules) {
    if (rule.target_agent === resolvedRoute.target_agent) {
      return {
        matched: true,
        targetAgent: resolvedRoute.target_agent,
        matchedRule: rule,
        matchedReason: getMatchedContent(rule.matcher, context),
        configOverrides: resolvedRoute.config_overrides,
      };
    }
  }

  return {
    matched: true,
    targetAgent: resolvedRoute.target_agent,
    matchedReason: "Route matched",
    configOverrides: resolvedRoute.config_overrides,
  };
}

/**
 * Create the preview result display DOM element
 *
 * @param result - The preview result to display
 * @param metaAgentName - The name of the meta-agent (optional)
 * @returns The created DOM element
 */
export function createPreviewResultElement(
  result: PreviewResult,
  metaAgentName?: string,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "preview-result-content";

  if (!result.matched) {
    // No match display
    container.innerHTML = `
      <div class="preview-no-match">
        <div class="preview-status-icon">⚠️</div>
        <div class="preview-no-match-message">
          <strong>No match</strong>
          <p>${escapeHtml(result.matchedReason || "No matching rule found")}</p>
        </div>
      </div>
    `;
    return container;
  }

  // Match display
  const metaAgentHtml = metaAgentName
    ? `<div class="preview-meta-agent"><strong>Meta-Agent:</strong> <code>${escapeHtml(metaAgentName)}</code></div>`
    : "";

  const configOverridesHtml = result.configOverrides
    ? `
      <div class="preview-config-overrides">
        <div class="preview-section-title">Config Overrides:</div>
        ${result.configOverrides.model ? `<div class="preview-override"><span class="override-label">Model:</span> <code>${escapeHtml(result.configOverrides.model)}</code></div>` : ""}
        ${result.configOverrides.temperature !== undefined ? `<div class="preview-override"><span class="override-label">Temperature:</span> <code>${result.configOverrides.temperature}</code></div>` : ""}
        ${result.configOverrides.variant ? `<div class="preview-override"><span class="override-label">Variant:</span> <code>${escapeHtml(result.configOverrides.variant)}</code></div>` : ""}
        ${result.configOverrides.prompt ? `<div class="preview-override"><span class="override-label">Prompt Override:</span> <code class="preview-prompt-override">${escapeHtml(result.configOverrides.prompt)}</code></div>` : ""}
      </div>
    `
    : "";

  container.innerHTML = `
    <div class="preview-match">
      <div class="preview-status-icon">✅</div>
      <div class="preview-match-details">
        ${metaAgentHtml}
        <div class="preview-target-agent">
          <strong>Target Agent:</strong>
          <span class="preview-agent-badge">${escapeHtml(result.targetAgent || "unknown")}</span>
        </div>
        <div class="preview-matched-rule">
          <div class="preview-section-title">Matched Rule:</div>
          <div class="preview-rule-type">${escapeHtml(result.matchedRule?.matcher.type || "unknown")}</div>
          <div class="preview-match-reason">${escapeHtml(result.matchedReason || "")}</div>
        </div>
        ${configOverridesHtml}
      </div>
    </div>
  `;

  return container;
}

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param text - The text to escape
 * @returns The escaped text
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render the preview result in the DOM
 *
 * @param container - The container element to render into
 * @param result - The preview result to display
 * @param metaAgentName - The name of the meta-agent (optional)
 */
export function renderPreviewResult(
  container: HTMLElement,
  result: PreviewResult,
  metaAgentName?: string,
): void {
  if (!container) {
    throw new Error("Preview result container is required");
  }

  container.innerHTML = "";
  container.appendChild(createPreviewResultElement(result, metaAgentName));
}

/**
 * Clear the preview result and show placeholder
 *
 * @param container - The container element to clear
 */
export function clearPreviewResult(container: HTMLElement): void {
  if (!container) {
    throw new Error("Preview result container is required");
  }

  container.innerHTML = `
    <div class="preview-placeholder">
      Enter a prompt to see the routing result
    </div>
  `;
}

/**
 * Create meta-agent selector dropdown
 *
 * @param metaAgents - Array of meta-agent names
 * @param selectedMetaAgent - Currently selected meta-agent name
 * @param onChange - Callback when selection changes
 * @returns The created select element
 */
export function createMetaAgentSelector(
  metaAgents: string[],
  selectedMetaAgent: string | null,
  onChange: (metaAgentName: string | null) => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "preview-meta-selector";

  const label = document.createElement("label");
  label.className = "preview-selector-label";
  label.textContent = "Meta-Agent to Preview:";
  label.setAttribute("for", "preview-meta-agent-select");

  const select = document.createElement("select");
  select.id = "preview-meta-agent-select";
  select.className = "preview-select";

  // Add options
  if (metaAgents.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No meta-agents available";
    option.disabled = true;
    select.appendChild(option);
  } else {
    metaAgents.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === selectedMetaAgent) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  select.addEventListener("change", () => {
    const value = select.value || null;
    onChange(value);
  });

  container.appendChild(label);
  container.appendChild(select);

  return container;
}

/**
 * Initialize the preview panel component
 *
 * @param config - The current Olimpus configuration
 * @param onConfigChange - Callback when configuration changes
 * @returns Object with update, destroy, and other methods
 */
export function initializePreviewPanel(
  config: OlimpusConfig,
  onConfigChange: (newConfig: OlimpusConfig) => void,
): {
  update: (newConfig: OlimpusConfig) => void;
  updatePreview: () => void;
  setMetaAgent: (name: string | null) => void;
  getMetaAgent: () => string | null;
  destroy: () => void;
} {
  const promptTextarea = document.getElementById("preview-prompt") as HTMLTextAreaElement;
  const resultContainer = document.getElementById("preview-result");

  if (!promptTextarea) {
    throw new Error("Preview prompt textarea not found");
  }

  if (!resultContainer) {
    throw new Error("Preview result container not found");
  }

  // State
  let currentConfig = config;
  let selectedMetaAgent: string | null = null;

  // Get initial meta-agent
  const metaAgentNames = getMetaAgentNames(config);
  if (metaAgentNames.length > 0) {
    selectedMetaAgent = metaAgentNames[0];
  }

  // Insert meta-agent selector before the textarea
  const metaSelectorContainer = document.createElement("div");
  metaSelectorContainer.className = "preview-meta-selector-container";

  const updateSelector = () => {
    metaSelectorContainer.innerHTML = "";
    const names = getMetaAgentNames(currentConfig);
    if (names.length > 0) {
      const selector = createMetaAgentSelector(
        names,
        selectedMetaAgent,
        (value) => {
          selectedMetaAgent = value;
          updatePreview();
        },
      );
      metaSelectorContainer.appendChild(selector);
    }
  };

  // Add selector to DOM
  const inputGroup = promptTextarea.closest(".preview-input-group");
  if (inputGroup) {
    inputGroup.parentElement?.insertBefore(metaSelectorContainer, inputGroup);
  } else {
    const previewContent = document.querySelector(".preview-content");
    if (previewContent) {
      previewContent.insertBefore(metaSelectorContainer, previewContent.firstChild);
    }
  }

  updateSelector();

  // Debounce function for input
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_DELAY = 300;

  /**
   * Update the preview based on current input and config
   */
  function updatePreview(): void {
    const prompt = promptTextarea.value.trim();

    if (!prompt) {
      clearPreviewResult(resultContainer);
      return;
    }

    if (!selectedMetaAgent) {
      renderPreviewResult(resultContainer, {
        matched: false,
        matchedReason: "No meta-agent selected",
      });
      return;
    }

    const metaAgents = currentConfig.meta_agents || {};
    const metaAgent = metaAgents[selectedMetaAgent];

    if (!metaAgent) {
      renderPreviewResult(resultContainer, {
        matched: false,
        matchedReason: `Meta-agent "${selectedMetaAgent}" not found`,
      });
      return;
    }

    const result = evaluatePreview(metaAgent, prompt);
    renderPreviewResult(resultContainer, result, selectedMetaAgent);
  }

  // Handle input changes with debounce
  const handleInput = (): void => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      updatePreview();
      debounceTimer = null;
    }, DEBOUNCE_DELAY);
  };

  promptTextarea.addEventListener("input", handleInput);

  // Initial render
  clearPreviewResult(resultContainer);

  return {
    update: (newConfig: OlimpusConfig): void => {
      currentConfig = newConfig;
      updateSelector();

      // Re-select if current selection no longer exists
      const names = getMetaAgentNames(newConfig);
      if (selectedMetaAgent && !names.includes(selectedMetaAgent)) {
        selectedMetaAgent = names.length > 0 ? names[0] : null;
      }

      updatePreview();
    },
    updatePreview: (): void => {
      updatePreview();
    },
    setMetaAgent: (name: string | null): void => {
      selectedMetaAgent = name;
      updateSelector();
      updatePreview();
    },
    getMetaAgent: (): string | null => {
      return selectedMetaAgent;
    },
    destroy: (): void => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      promptTextarea.removeEventListener("input", handleInput);
      metaSelectorContainer.remove();
    },
  };
}
