/**
 * Routing Rule List Component
 *
 * Handles rendering and management of routing rules including
 * display, reorder (drag-and-drop), and add/delete functionality.
 */

import type { OlimpusConfig, RoutingRule, Matcher } from "./types";

/**
 * Current meta-agent context for the rule list
 */
interface RuleListContext {
  metaAgentName: string;
  config: OlimpusConfig;
}

/**
 * Default values for a new routing rule
 */
const DEFAULT_ROUTING_RULE: RoutingRule = {
  matcher: { type: "always" },
  target_agent: "sisyphus",
};

/**
 * Format matcher type for display
 *
 * @param matcher - The matcher to format
 * @returns Human-readable matcher description
 */
function formatMatcher(matcher: Matcher): string {
  switch (matcher.type) {
    case "keyword":
      const mode = matcher.mode === "all" ? "ALL" : "ANY";
      const count = matcher.keywords?.length || 0;
      return `Keyword (${mode} of ${count})`;
    case "complexity":
      return `Complexity (${matcher.threshold})`;
    case "regex":
      const flags = matcher.flags ? ` [${matcher.flags}]` : "";
      return `Regex${flags}`;
    case "project_context":
      const files = matcher.has_files?.length || 0;
      const deps = matcher.has_deps?.length || 0;
      if (files > 0 && deps > 0) {
        return `Project Context (${files} files, ${deps} deps)`;
      }
      if (files > 0) {
        return `Project Context (${files} files)`;
      }
      if (deps > 0) {
        return `Project Context (${deps} deps)`;
      }
      return "Project Context";
    case "always":
      return "Always (fallback)";
    default:
      return "Unknown";
  }
}

/**
 * Check if a matcher has config overrides
 *
 * @param rule - The routing rule to check
 * @returns true if config_overrides exist
 */
function hasConfigOverrides(rule: RoutingRule): boolean {
  return (
    rule.config_overrides !== undefined &&
    Object.keys(rule.config_overrides).length > 0
  );
}

/**
 * Get a summary of config overrides
 *
 * @param rule - The routing rule
 * @returns Summary text for overrides
 */
function getOverridesSummary(rule: RoutingRule): string {
  if (!hasConfigOverrides(rule)) {
    return "";
  }

  const overrides = rule.config_overrides!;
  const parts: string[] = [];

  if (overrides.model) {
    parts.push(`model: ${overrides.model}`);
  }
  if (overrides.temperature !== undefined) {
    parts.push(`temp: ${overrides.temperature}`);
  }
  if (overrides.variant) {
    parts.push(`variant: ${overrides.variant}`);
  }
  if (overrides.prompt) {
    parts.push("custom prompt");
  }

  return parts.length > 0 ? ` • ${parts.join(", ")}` : "";
}

/**
 * Create a routing rule item DOM element
 *
 * @param index - The rule index in the array
 * @param rule - The routing rule data
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @param onDragStart - Callback when drag starts
 * @param onDragOver - Callback when dragged over
 * @param onDrop - Callback when dropped
 * @param onDragEnd - Callback when drag ends
 * @returns The created DOM element
 */
function createRuleItem(
  index: number,
  rule: RoutingRule,
  onEdit: (index: number) => void,
  onDelete: (index: number) => void,
  onDragStart: (index: number, event: DragEvent) => void,
  onDragOver: (event: DragEvent) => void,
  onDrop: (event: DragEvent, targetIndex: number) => void,
  onDragEnd: (event: DragEvent) => void,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "rule-item";
  item.setAttribute("draggable", "true");
  item.setAttribute("data-rule-index", String(index));
  item.setAttribute("role", "listitem");
  item.setAttribute("aria-label", `Routing rule ${index + 1}`);

  const itemContent = document.createElement("div");
  itemContent.className = "rule-item-content";

  // Drag handle
  const dragHandle = document.createElement("div");
  dragHandle.className = "rule-drag-handle";
  dragHandle.innerHTML = "⋮⋮";
  dragHandle.setAttribute("aria-label", "Drag to reorder");
  dragHandle.setAttribute("title", "Drag to reorder");

  // Rule number badge
  const numberBadge = document.createElement("span");
  numberBadge.className = "rule-number";
  numberBadge.textContent = String(index + 1);

  // Rule details
  const details = document.createElement("div");
  details.className = "rule-details";

  const matcherEl = document.createElement("div");
  matcherEl.className = "rule-matcher";
  matcherEl.textContent = formatMatcher(rule.matcher);

  const targetEl = document.createElement("div");
  targetEl.className = "rule-target";
  targetEl.innerHTML = `Target: <code class="rule-target-agent">${rule.target_agent}</code>${getOverridesSummary(rule)}`;

  details.appendChild(matcherEl);
  details.appendChild(targetEl);

  // Action buttons
  const actionsEl = document.createElement("div");
  actionsEl.className = "rule-item-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "btn btn-secondary btn-sm";
  editBtn.setAttribute("aria-label", `Edit rule ${index + 1}`);
  editBtn.innerHTML = `<span class="btn-icon">✏️</span> Edit`;
  editBtn.addEventListener("click", () => onEdit(index));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.setAttribute("aria-label", `Delete rule ${index + 1}`);
  deleteBtn.innerHTML = `<span class="btn-icon">🗑️</span> Delete`;
  deleteBtn.addEventListener("click", () => onDelete(index));

  actionsEl.appendChild(editBtn);
  actionsEl.appendChild(deleteBtn);

  itemContent.appendChild(dragHandle);
  itemContent.appendChild(numberBadge);
  itemContent.appendChild(details);
  itemContent.appendChild(actionsEl);

  item.appendChild(itemContent);

  // Drag and drop event handlers
  item.addEventListener("dragstart", (event) => onDragStart(index, event));
  item.addEventListener("dragover", onDragOver);
  item.addEventListener("drop", (event) => onDrop(event, index));
  item.addEventListener("dragend", onDragEnd);

  return item;
}

/**
 * Create an empty state message when no rules exist
 *
 * @returns The empty state DOM element
 */
function createEmptyState(): HTMLElement {
  const emptyEl = document.createElement("div");
  emptyEl.className = "list-empty";
  emptyEl.innerHTML = `
    <p class="mb-md">No routing rules configured yet.</p>
    <p class="text-muted">Select a meta-agent to see its rules, or add a new rule.</p>
  `;
  return emptyEl;
}

/**
 * Create a meta-agent selector element
 *
 * @param config - The current Olimpus config
 * @param selectedMetaAgent - Currently selected meta-agent name
 * @param onSelect - Callback when meta-agent is selected
 * @returns The created select element
 */
function createMetaAgentSelector(
  config: OlimpusConfig,
  selectedMetaAgent: string | null,
  onSelect: (name: string | null) => void,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "meta-agent-selector";

  const label = document.createElement("label");
  label.className = "form-group-label";
  label.setAttribute("for", "rule-list-meta-agent");
  label.textContent = "Meta-Agent:";

  const select = document.createElement("select");
  select.id = "rule-list-meta-agent";
  select.className = "form-group-select";

  // Add "None" option to clear selection
  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "-- Select a meta-agent --";
  select.appendChild(noneOption);

  // Add meta-agent options
  const metaAgents = config.meta_agents || {};
  const metaAgentNames = Object.keys(metaAgents).sort();

  for (const name of metaAgentNames) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === selectedMetaAgent) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    onSelect(select.value || null);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);

  return wrapper;
}

/**
 * Render the routing rules list in the DOM
 *
 * @param container - The container element to render into
 * @param context - The rule list context
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @param onReorder - Callback when rules are reordered
 */
export function renderRuleList(
  container: HTMLElement,
  context: RuleListContext,
  onEdit: (index: number) => void,
  onDelete: (index: number) => void,
  onReorder: (fromIndex: number, toIndex: number) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  // Clear existing content
  container.innerHTML = "";

  const metaAgents = context.config.meta_agents || {};
  const metaAgent = metaAgents[context.metaAgentName];

  // Show empty state if no meta-agent selected
  if (!context.metaAgentName || !metaAgent) {
    container.appendChild(createEmptyState());
    return;
  }

  const rules = metaAgent.routing_rules || [];

  // Show empty state if no rules
  if (rules.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "list-empty";
    emptyEl.innerHTML = `
      <p class="mb-md">No routing rules configured for "${context.metaAgentName}".</p>
      <p class="text-muted">Click "Add Rule" to create your first routing rule.</p>
    `;
    container.appendChild(emptyEl);
    return;
  }

  // Track drag state
  let draggedIndex: number | null = null;

  // Drag event handlers
  const handleDragStart = (index: number, event: DragEvent): void => {
    draggedIndex = index;
    event.dataTransfer?.setData("text/plain", String(index));
    event.dataTransfer?.effectAllowed = "move";
    (event.target as HTMLElement).classList.add("rule-dragging");
  };

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
  };

  const handleDrop = (event: DragEvent, targetIndex: number): void => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorder(draggedIndex, targetIndex);
    }
  };

  const handleDragEnd = (event: DragEvent): void => {
    draggedIndex = null;
    (event.target as HTMLElement).classList.remove("rule-dragging");
  };

  // Render each rule
  for (let i = 0; i < rules.length; i++) {
    const item = createRuleItem(
      i,
      rules[i],
      onEdit,
      onDelete,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
    );
    container.appendChild(item);
  }
}

/**
 * Add a new routing rule to the meta-agent
 *
 * @param config - The current Olimpus config
 * @param metaAgentName - The meta-agent name to add rule to
 * @returns Updated config with new rule
 * @throws Error if meta-agent does not exist
 */
export function addRule(
  config: OlimpusConfig,
  metaAgentName: string,
): OlimpusConfig {
  const metaAgents = config.meta_agents || {};
  const metaAgent = metaAgents[metaAgentName];

  if (!metaAgent) {
    throw new Error(`Meta-agent "${metaAgentName}" does not exist`);
  }

  return {
    ...config,
    meta_agents: {
      ...metaAgents,
      [metaAgentName]: {
        ...metaAgent,
        routing_rules: [...(metaAgent.routing_rules || []), { ...DEFAULT_ROUTING_RULE }],
      },
    },
  };
}

/**
 * Delete a routing rule from the meta-agent
 *
 * @param config - The current Olimpus config
 * @param metaAgentName - The meta-agent name to delete rule from
 * @param ruleIndex - The index of the rule to delete
 * @returns Updated config without the deleted rule
 * @throws Error if meta-agent or rule does not exist
 */
export function deleteRule(
  config: OlimpusConfig,
  metaAgentName: string,
  ruleIndex: number,
): OlimpusConfig {
  const metaAgents = config.meta_agents || {};
  const metaAgent = metaAgents[metaAgentName];

  if (!metaAgent) {
    throw new Error(`Meta-agent "${metaAgentName}" does not exist`);
  }

  const rules = metaAgent.routing_rules || [];

  if (ruleIndex < 0 || ruleIndex >= rules.length) {
    throw new Error(`Rule index ${ruleIndex} is out of range`);
  }

  const newRules = rules.filter((_, i) => i !== ruleIndex);

  return {
    ...config,
    meta_agents: {
      ...metaAgents,
      [metaAgentName]: {
        ...metaAgent,
        routing_rules: newRules,
      },
    },
  };
}

/**
 * Reorder routing rules
 *
 * @param config - The current Olimpus config
 * @param metaAgentName - The meta-agent name
 * @param fromIndex - The index to move from
 * @param toIndex - The index to move to
 * @returns Updated config with reordered rules
 * @throws Error if meta-agent or indexes are invalid
 */
export function reorderRule(
  config: OlimpusConfig,
  metaAgentName: string,
  fromIndex: number,
  toIndex: number,
): OlimpusConfig {
  const metaAgents = config.meta_agents || {};
  const metaAgent = metaAgents[metaAgentName];

  if (!metaAgent) {
    throw new Error(`Meta-agent "${metaAgentName}" does not exist`);
  }

  const rules = [...(metaAgent.routing_rules || [])];

  if (fromIndex < 0 || fromIndex >= rules.length) {
    throw new Error(`Source index ${fromIndex} is out of range`);
  }

  if (toIndex < 0 || toIndex >= rules.length) {
    throw new Error(`Target index ${toIndex} is out of range`);
  }

  // Remove from source and insert at destination
  const [removed] = rules.splice(fromIndex, 1);
  rules.splice(toIndex, 0, removed);

  return {
    ...config,
    meta_agents: {
      ...metaAgents,
      [metaAgentName]: {
        ...metaAgent,
        routing_rules: rules,
      },
    },
  };
}

/**
 * Initialize the routing rule list with event handlers
 *
 * @param config - The current Olimpus config
 * @param selectedMetaAgent - Currently selected meta-agent name
 * @param onConfigChange - Callback when configuration changes
 * @param onEditRule - Callback when a rule is edited
 * @returns Object with cleanup and selection methods
 */
export function initializeRuleList(
  config: OlimpusConfig,
  selectedMetaAgent: string | null,
  onConfigChange: (newConfig: OlimpusConfig) => void,
  onEditRule?: (metaAgentName: string, ruleIndex: number) => void,
): {
  update: (newConfig: OlimpusConfig) => void;
  setMetaAgent: (name: string | null) => void;
  destroy: () => void;
} {
  const container = document.getElementById("routing-rules-list");
  const panelHeader = document.querySelector(
    "#panel-routing-rules .panel-header",
  ) as HTMLElement;

  if (!container) {
    throw new Error("Routing rules list container not found");
  }

  if (!panelHeader) {
    throw new Error("Routing rules panel header not found");
  }

  let currentConfig = config;
  let currentMetaAgent = selectedMetaAgent;
  let selectorElement: HTMLElement | null = null;

  // Function to handle rule addition
  const handleAdd = (): void => {
    if (!currentMetaAgent) {
      alert("Please select a meta-agent first");
      return;
    }

    try {
      const updatedConfig = addRule(currentConfig, currentMetaAgent);
      currentConfig = updatedConfig;
      renderRuleList(
        container,
        { metaAgentName: currentMetaAgent, config: currentConfig },
        handleEdit,
        handleDelete,
        handleReorder,
      );
      onConfigChange(currentConfig);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Function to handle rule deletion
  const handleDelete = (index: number): void => {
    if (!currentMetaAgent) {
      return;
    }

    try {
      if (confirm(`Are you sure you want to delete routing rule ${index + 1}?`)) {
        const updatedConfig = deleteRule(currentConfig, currentMetaAgent, index);
        currentConfig = updatedConfig;
        renderRuleList(
          container,
          { metaAgentName: currentMetaAgent, config: currentConfig },
          handleEdit,
          handleDelete,
          handleReorder,
        );
        onConfigChange(currentConfig);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Function to handle rule editing
  const handleEdit = (index: number): void => {
    if (currentMetaAgent && onEditRule) {
      onEditRule(currentMetaAgent, index);
    }
  };

  // Function to handle rule reordering
  const handleReorder = (fromIndex: number, toIndex: number): void => {
    if (!currentMetaAgent) {
      return;
    }

    try {
      const updatedConfig = reorderRule(
        currentConfig,
        currentMetaAgent,
        fromIndex,
        toIndex,
      );
      currentConfig = updatedConfig;
      renderRuleList(
        container,
        { metaAgentName: currentMetaAgent, config: currentConfig },
        handleEdit,
        handleDelete,
        handleReorder,
      );
      onConfigChange(currentConfig);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Function to handle meta-agent selection change
  const handleMetaAgentSelect = (name: string | null): void => {
    currentMetaAgent = name;

    // Update add button state
    const addBtn = document.getElementById("btn-add-rule");
    if (addBtn) {
      addBtn.disabled = !name;
    }

    renderRuleList(
      container,
      { metaAgentName: name || "", config: currentConfig },
      handleEdit,
      handleDelete,
      handleReorder,
    );
  };

  // Create and add meta-agent selector
  const createSelector = (): void => {
    if (selectorElement) {
      selectorElement.remove();
    }

    selectorElement = createMetaAgentSelector(
      currentConfig,
      currentMetaAgent,
      handleMetaAgentSelect,
    );

    // Insert after the panel description
    const description = panelHeader.querySelector(".panel-description");
    if (description && description.parentNode) {
      description.parentNode.insertBefore(selectorElement, description.nextSibling);
    }
  };

  // Add "Add Rule" button to panel header if it doesn't exist
  const createAddButton = (): void => {
    const existingBtn = document.getElementById("btn-add-rule");
    if (existingBtn) {
      return;
    }

    const addBtn = document.createElement("button");
    addBtn.id = "btn-add-rule";
    addBtn.className = "btn btn-primary";
    addBtn.disabled = !currentMetaAgent;
    addBtn.innerHTML = `<span class="btn-icon">+</span> Add Rule`;

    addBtn.addEventListener("click", handleAdd);

    const headerContent = panelHeader.querySelector(".panel-header");
    if (headerContent) {
      headerContent.appendChild(addBtn);
    }
  };

  // Add button and selector to panel header
  createAddButton();
  createSelector();

  // Initial render
  renderRuleList(
    container,
    { metaAgentName: currentMetaAgent || "", config: currentConfig },
    handleEdit,
    handleDelete,
    handleReorder,
  );

  // Return cleanup and control methods
  return {
    update: (newConfig: OlimpusConfig): void => {
      currentConfig = newConfig;
      // Re-create selector to update meta-agent options
      if (selectorElement) {
        createSelector();
      }
      renderRuleList(
        container,
        { metaAgentName: currentMetaAgent || "", config: currentConfig },
        handleEdit,
        handleDelete,
        handleReorder,
      );
    },
    setMetaAgent: (name: string | null): void => {
      handleMetaAgentSelect(name);
    },
    destroy: (): void => {
      if (selectorElement) {
        selectorElement.remove();
      }
      const addBtn = document.getElementById("btn-add-rule");
      if (addBtn) {
        addBtn.remove();
      }
    },
  };
}
