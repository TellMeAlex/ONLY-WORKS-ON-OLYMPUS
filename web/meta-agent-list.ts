/**
 * Meta-Agent List Component
 *
 * Handles rendering and management of the meta-agents list including
 * add/delete functionality and DOM manipulation.
 */

import type { OlimpusConfig, MetaAgentDef } from "./types";

/**
 * Default values for a new meta-agent
 */
const DEFAULT_META_AGENT: MetaAgentDef = {
  base_model: "claude-3-5-sonnet-20241022",
  delegates_to: [],
  routing_rules: [],
  temperature: 0.7,
};

/**
 * Generate a unique ID for a new meta-agent
 *
 * @returns A unique string identifier
 */
function generateMetaAgentId(): string {
  return `meta-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate a meta-agent ID (must be alphanumeric with hyphens/underscores)
 *
 * @param id - The ID to validate
 * @returns true if valid, false otherwise
 */
function isValidMetaAgentId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0;
}

/**
 * Create a meta-agent item DOM element
 *
 * @param name - The meta-agent name/key
 * @def - The meta-agent definition
 * @param onDelete - Callback when delete button is clicked
 * @returns The created DOM element
 */
function createMetaAgentItem(
  name: string,
  def: MetaAgentDef,
  onDelete: (name: string) => void,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "meta-agent-item";
  item.setAttribute("data-meta-agent", name);

  const itemContent = document.createElement("div");
  itemContent.className = "meta-agent-item-content";

  // Meta-agent name/title
  const nameEl = document.createElement("h3");
  nameEl.className = "meta-agent-name";
  nameEl.textContent = name;
  nameEl.setAttribute("contenteditable", "true");
  nameEl.setAttribute("data-field", "name");

  // Meta-agent summary
  const summaryEl = document.createElement("div");
  summaryEl.className = "meta-agent-summary";

  const baseModelEl = document.createElement("span");
  baseModelEl.className = "meta-agent-base-model";
  baseModelEl.textContent = `Base: ${def.base_model}`;

  const delegatesEl = document.createElement("span");
  delegatesEl.className = "meta-agent-delegates";
  const delegateCount = def.delegates_to.length;
  delegatesEl.textContent = `Delegates to: ${delegateCount} agent${delegateCount !== 1 ? "s" : ""}`;

  const rulesEl = document.createElement("span");
  rulesEl.className = "meta-agent-rules";
  const ruleCount = def.routing_rules.length;
  rulesEl.textContent = `${ruleCount} routing rule${ruleCount !== 1 ? "s" : ""}`;

  summaryEl.appendChild(baseModelEl);
  summaryEl.appendChild(document.createTextNode(" • "));
  summaryEl.appendChild(delegatesEl);
  summaryEl.appendChild(document.createTextNode(" • "));
  summaryEl.appendChild(rulesEl);

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.setAttribute("aria-label", `Delete meta-agent ${name}`);
  deleteBtn.innerHTML = `<span class="btn-icon">🗑️</span> Delete`;
  deleteBtn.addEventListener("click", () => onDelete(name));

  // Add edit button for future expansion
  const editBtn = document.createElement("button");
  editBtn.className = "btn btn-secondary btn-sm";
  editBtn.setAttribute("aria-label", `Edit meta-agent ${name}`);
  editBtn.innerHTML = `<span class="btn-icon">✏️</span> Edit`;

  const actionsEl = document.createElement("div");
  actionsEl.className = "meta-agent-item-actions";
  actionsEl.appendChild(editBtn);
  actionsEl.appendChild(deleteBtn);

  itemContent.appendChild(nameEl);
  itemContent.appendChild(summaryEl);

  item.appendChild(itemContent);
  item.appendChild(actionsEl);

  return item;
}

/**
 * Create an empty state message when no meta-agents exist
 *
 * @returns The empty state DOM element
 */
function createEmptyState(): HTMLElement {
  const emptyEl = document.createElement("div");
  emptyEl.className = "list-empty";
  emptyEl.innerHTML = `
    <p class="mb-md">No meta-agents configured yet.</p>
    <p class="text-muted">Click "Add Meta-Agent" to create your first meta-agent.</p>
  `;
  return emptyEl;
}

/**
 * Render the meta-agents list in the DOM
 *
 * @param container - The container element to render into
 * @param config - The current Olimpus config
 * @param onDelete - Callback when a meta-agent is deleted
 */
export function renderMetaAgentList(
  container: HTMLElement,
  config: OlimpusConfig,
  onDelete: (name: string) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  // Clear existing content
  container.innerHTML = "";

  const metaAgents = config.meta_agents || {};

  // Show empty state if no meta-agents
  if (Object.keys(metaAgents).length === 0) {
    container.appendChild(createEmptyState());
    return;
  }

  // Render each meta-agent
  for (const [name, def] of Object.entries(metaAgents)) {
    const item = createMetaAgentItem(name, def, onDelete);
    container.appendChild(item);
  }
}

/**
 * Add a new meta-agent to the configuration
 *
 * @param config - The current Olimpus config
 * @param name - The name/key for the new meta-agent
 * @returns Updated config with new meta-agent
 * @throws Error if name is invalid or already exists
 */
export function addMetaAgent(
  config: OlimpusConfig,
  name: string,
): OlimpusConfig {
  if (!name || !name.trim()) {
    throw new Error("Meta-agent name cannot be empty");
  }

  const trimmedName = name.trim();

  if (!isValidMetaAgentId(trimmedName)) {
    throw new Error("Meta-agent name must contain only letters, numbers, hyphens, and underscores");
  }

  const metaAgents = config.meta_agents || {};

  if (metaAgents[trimmedName]) {
    throw new Error(`Meta-agent "${trimmedName}" already exists`);
  }

  return {
    ...config,
    meta_agents: {
      ...metaAgents,
      [trimmedName]: { ...DEFAULT_META_AGENT },
    },
  };
}

/**
 * Delete a meta-agent from the configuration
 *
 * @param config - The current Olimpus config
 * @param name - The name/key of the meta-agent to delete
 * @returns Updated config without the deleted meta-agent
 * @throws Error if meta-agent does not exist
 */
export function deleteMetaAgent(
  config: OlimpusConfig,
  name: string,
): OlimpusConfig {
  const metaAgents = config.meta_agents || {};

  if (!metaAgents[name]) {
    throw new Error(`Meta-agent "${name}" does not exist`);
  }

  const { [name]: deleted, ...remainingAgents } = metaAgents;

  return {
    ...config,
    meta_agents: Object.keys(remainingAgents).length > 0 ? remainingAgents : undefined,
  };
}

/**
 * Prompt user for a new meta-agent name
 *
 * @returns The entered name or null if cancelled
 */
export function promptForMetaAgentName(): string | null {
  const name = prompt("Enter a name for the new meta-agent:");

  if (name === null) {
    return null;
  }

  return name.trim() || null;
}

/**
 * Initialize the meta-agent list with event handlers
 *
 * @param config - The current Olimpus config
 * @param onConfigChange - Callback when configuration changes
 * @returns Object with cleanup function
 */
export function initializeMetaAgentList(
  config: OlimpusConfig,
  onConfigChange: (newConfig: OlimpusConfig) => void,
): { update: (newConfig: OlimpusConfig) => void; destroy: () => void } {
  const container = document.getElementById("meta-agents-list");
  const addBtn = document.getElementById("btn-add-meta-agent");

  if (!container) {
    throw new Error("Meta-agents list container not found");
  }

  if (!addBtn) {
    throw new Error("Add meta-agent button not found");
  }

  // Function to handle meta-agent deletion
  const handleDelete = (name: string): void => {
    try {
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        const updatedConfig = deleteMetaAgent(config, name);
        config = updatedConfig;
        renderMetaAgentList(container, config, handleDelete);
        onConfigChange(config);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Add button click handler
  const addHandler = (): void => {
    const name = promptForMetaAgentName();

    if (name) {
      try {
        const updatedConfig = addMetaAgent(config, name);
        config = updatedConfig;
        renderMetaAgentList(container, config, handleDelete);
        onConfigChange(config);
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
      }
    }
  };

  addBtn.addEventListener("click", addHandler);

  // Initial render
  renderMetaAgentList(container, config, handleDelete);

  // Return cleanup function
  return {
    update: (newConfig: OlimpusConfig): void => {
      config = newConfig;
      renderMetaAgentList(container, config, handleDelete);
    },
    destroy: (): void => {
      addBtn.removeEventListener("click", addHandler);
    },
  };
}
