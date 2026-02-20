/**
 * Other Configurations Component
 *
 * Handles the UI for agents, categories, and skills configuration.
 * These are passthrough sections for oh-my-opencode integration.
 */

import type { AgentOverride, CategoryConfig } from "./types";

// ============================================================================
// SECTION 1: AGENTS
// ============================================================================

/**
 * Default values for a new agent override
 */
const DEFAULT_AGENT: AgentOverride = {
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.5,
  description: "",
  disable: false,
};

/**
 * Validate an agent key (must be alphanumeric with hyphens/underscores)
 *
 * @param key - The key to validate
 * @returns true if valid, false otherwise
 */
function isValidAgentKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(key) && key.length > 0;
}

/**
 * Create an agent item DOM element
 *
 * @param key - The agent key/name
 * @param agent - The agent configuration
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @returns The created DOM element
 */
function createAgentItem(
  key: string,
  agent: AgentOverride,
  onEdit: (key: string) => void,
  onDelete: (key: string) => void,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "config-item agent-item";
  item.setAttribute("data-agent", key);

  const itemContent = document.createElement("div");
  itemContent.className = "config-item-content";

  // Agent name
  const nameEl = document.createElement("h3");
  nameEl.className = "config-item-name";
  nameEl.textContent = key;

  // Agent summary
  const summaryEl = document.createElement("div");
  summaryEl.className = "config-item-summary";

  if (agent.model) {
    const modelEl = document.createElement("span");
    modelEl.className = "config-item-badge";
    modelEl.textContent = agent.model;
    summaryEl.appendChild(modelEl);
  }

  if (agent.temperature !== undefined) {
    const tempEl = document.createElement("span");
    tempEl.className = "config-item-badge";
    tempEl.textContent = `Temp: ${agent.temperature}`;
    summaryEl.appendChild(tempEl);
  }

  if (agent.description) {
    const descEl = document.createElement("span");
    descEl.className = "config-item-description";
    descEl.textContent = agent.description;
    summaryEl.appendChild(descEl);
  }

  if (agent.disable) {
    const disabledEl = document.createElement("span");
    disabledEl.className = "config-item-badge config-item-badge-warning";
    disabledEl.textContent = "Disabled";
    summaryEl.appendChild(disabledEl);
  }

  // Action buttons
  const actionsEl = document.createElement("div");
  actionsEl.className = "config-item-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-secondary btn-sm";
  editBtn.setAttribute("aria-label", `Edit agent ${key}`);
  editBtn.innerHTML = `<span class="btn-icon">✏️</span> Edit`;
  editBtn.addEventListener("click", () => onEdit(key));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.setAttribute("aria-label", `Delete agent ${key}`);
  deleteBtn.innerHTML = `<span class="btn-icon">🗑️</span> Delete`;
  deleteBtn.addEventListener("click", () => onDelete(key));

  actionsEl.appendChild(editBtn);
  actionsEl.appendChild(deleteBtn);

  itemContent.appendChild(nameEl);
  itemContent.appendChild(summaryEl);
  item.appendChild(itemContent);
  item.appendChild(actionsEl);

  return item;
}

/**
 * Render agents list in DOM
 *
 * @param container - The container element to render into
 * @param agents - The agents configuration object
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 */
function renderAgentsList(
  container: HTMLElement,
  agents: Record<string, AgentOverride>,
  onEdit: (key: string) => void,
  onDelete: (key: string) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  container.innerHTML = "";

  const agentKeys = Object.keys(agents);

  if (agentKeys.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "list-empty";
    emptyEl.innerHTML = `
      <p class="mb-md">No agents configured yet.</p>
      <p class="text-muted">Click "Add Agent" to create your first agent override.</p>
    `;
    container.appendChild(emptyEl);
    return;
  }

  for (const [key, agent] of Object.entries(agents)) {
    const item = createAgentItem(key, agent, onEdit, onDelete);
    container.appendChild(item);
  }
}

/**
 * Create agent form for adding/editing agents
 *
 * @param agent - Current agent configuration (undefined for new agent)
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
function createAgentForm(
  agent: AgentOverride | undefined,
  onChange: (agent: AgentOverride) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "config-form agent-form";
  form.addEventListener("submit", (e) => e.preventDefault());

  const currentAgent: AgentOverride = agent ? { ...agent } : { ...DEFAULT_AGENT };

  // Model input
  const modelInput = document.createElement("input");
  modelInput.type = "text";
  modelInput.id = "agent-model";
  modelInput.name = "model";
  modelInput.value = currentAgent.model || "";
  modelInput.placeholder = "e.g., claude-3-5-sonnet-20241022";
  modelInput.addEventListener("input", () => {
    currentAgent.model = modelInput.value.trim() || undefined;
    onChange(currentAgent);
  });

  const modelGroup = createFormGroup("Model", modelInput, "The LLM model to use for this agent");
  form.appendChild(modelGroup);

  // Temperature input
  const tempInput = document.createElement("input");
  tempInput.type = "number";
  tempInput.id = "agent-temperature";
  tempInput.name = "temperature";
  tempInput.value = String(currentAgent.temperature ?? 0.5);
  tempInput.min = "0";
  tempInput.max = "2";
  tempInput.step = "0.1";
  tempInput.addEventListener("input", () => {
    const val = parseFloat(tempInput.value);
    currentAgent.temperature = isNaN(val) ? undefined : val;
    onChange(currentAgent);
  });

  const tempGroup = createFormGroup("Temperature", tempInput, "Temperature for randomness (0-2)");
  form.appendChild(tempGroup);

  // Description input
  const descInput = document.createElement("textarea");
  descInput.id = "agent-description";
  descInput.name = "description";
  descInput.value = currentAgent.description || "";
  descInput.placeholder = "Describe this agent's purpose...";
  descInput.rows = 3;
  descInput.addEventListener("input", () => {
    currentAgent.description = descInput.value.trim() || undefined;
    onChange(currentAgent);
  });

  const descGroup = createFormGroup("Description", descInput, "Optional description of this agent");
  form.appendChild(descGroup);

  // Disable checkbox
  const disableCheckbox = document.createElement("input");
  disableCheckbox.type = "checkbox";
  disableCheckbox.id = "agent-disable";
  disableCheckbox.name = "disable";
  disableCheckbox.checked = currentAgent.disable ?? false;
  disableCheckbox.addEventListener("change", () => {
    currentAgent.disable = disableCheckbox.checked;
    onChange(currentAgent);
  });

  const disableGroup = createCheckboxGroup("Disable Agent", disableCheckbox, "Prevent this agent from being used");
  form.appendChild(disableGroup);

  // Optional: Variant and Prompt fields
  const variantInput = document.createElement("input");
  variantInput.type = "text";
  variantInput.id = "agent-variant";
  variantInput.name = "variant";
  variantInput.value = currentAgent.variant || "";
  variantInput.placeholder = "e.g., tdd, aggressive";
  variantInput.addEventListener("input", () => {
    currentAgent.variant = variantInput.value.trim() || undefined;
    onChange(currentAgent);
  });

  const variantGroup = createFormGroup("Variant", variantInput, "Optional variant name for specialized behavior");
  form.appendChild(variantGroup);

  const promptInput = document.createElement("textarea");
  promptInput.id = "agent-prompt";
  promptInput.name = "prompt";
  promptInput.value = currentAgent.prompt || "";
  promptInput.placeholder = "Custom prompt template...";
  promptInput.rows = 4;
  promptInput.addEventListener("input", () => {
    currentAgent.prompt = promptInput.value.trim() || undefined;
    onChange(currentAgent);
  });

  const promptGroup = createFormGroup("Custom Prompt", promptInput, "Optional custom prompt override");
  form.appendChild(promptGroup);

  return form;
}

// ============================================================================
// SECTION 2: CATEGORIES
// ============================================================================

/**
 * Default values for a new category
 */
const DEFAULT_CATEGORY: CategoryConfig = {
  description: "",
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.5,
};

/**
 * Validate a category key (must be alphanumeric with hyphens/underscores)
 *
 * @param key - The key to validate
 * @returns true if valid, false otherwise
 */
function isValidCategoryKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(key) && key.length > 0;
}

/**
 * Create a category item DOM element
 *
 * @param key - The category key/name
 * @param category - The category configuration
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @returns The created DOM element
 */
function createCategoryItem(
  key: string,
  category: CategoryConfig,
  onEdit: (key: string) => void,
  onDelete: (key: string) => void,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "config-item category-item";
  item.setAttribute("data-category", key);

  const itemContent = document.createElement("div");
  itemContent.className = "config-item-content";

  // Category name
  const nameEl = document.createElement("h3");
  nameEl.className = "config-item-name";
  nameEl.textContent = key;

  // Category summary
  const summaryEl = document.createElement("div");
  summaryEl.className = "config-item-summary";

  if (category.model) {
    const modelEl = document.createElement("span");
    modelEl.className = "config-item-badge";
    modelEl.textContent = category.model;
    summaryEl.appendChild(modelEl);
  }

  if (category.temperature !== undefined) {
    const tempEl = document.createElement("span");
    tempEl.className = "config-item-badge";
    tempEl.textContent = `Temp: ${category.temperature}`;
    summaryEl.appendChild(tempEl);
  }

  if (category.maxTokens !== undefined) {
    const tokensEl = document.createElement("span");
    tokensEl.className = "config-item-badge";
    tokensEl.textContent = `Max Tokens: ${category.maxTokens}`;
    summaryEl.appendChild(tokensEl);
  }

  if (category.description) {
    const descEl = document.createElement("span");
    descEl.className = "config-item-description";
    descEl.textContent = category.description;
    summaryEl.appendChild(descEl);
  }

  // Action buttons
  const actionsEl = document.createElement("div");
  actionsEl.className = "config-item-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-secondary btn-sm";
  editBtn.setAttribute("aria-label", `Edit category ${key}`);
  editBtn.innerHTML = `<span class="btn-icon">✏️</span> Edit`;
  editBtn.addEventListener("click", () => onEdit(key));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.setAttribute("aria-label", `Delete category ${key}`);
  deleteBtn.innerHTML = `<span class="btn-icon">🗑️</span> Delete`;
  deleteBtn.addEventListener("click", () => onDelete(key));

  actionsEl.appendChild(editBtn);
  actionsEl.appendChild(deleteBtn);

  itemContent.appendChild(nameEl);
  itemContent.appendChild(summaryEl);
  item.appendChild(itemContent);
  item.appendChild(actionsEl);

  return item;
}

/**
 * Render categories list in DOM
 *
 * @param container - The container element to render into
 * @param categories - The categories configuration object
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 */
function renderCategoriesList(
  container: HTMLElement,
  categories: Record<string, CategoryConfig>,
  onEdit: (key: string) => void,
  onDelete: (key: string) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  container.innerHTML = "";

  const categoryKeys = Object.keys(categories);

  if (categoryKeys.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "list-empty";
    emptyEl.innerHTML = `
      <p class="mb-md">No categories configured yet.</p>
      <p class="text-muted">Click "Add Category" to create your first category.</p>
    `;
    container.appendChild(emptyEl);
    return;
  }

  for (const [key, category] of Object.entries(categories)) {
    const item = createCategoryItem(key, category, onEdit, onDelete);
    container.appendChild(item);
  }
}

/**
 * Create category form for adding/editing categories
 *
 * @param category - Current category configuration (undefined for new category)
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
function createCategoryForm(
  category: CategoryConfig | undefined,
  onChange: (category: CategoryConfig) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "config-form category-form";
  form.addEventListener("submit", (e) => e.preventDefault());

  const currentCategory: CategoryConfig = category ? { ...category } : { ...DEFAULT_CATEGORY };

  // Description input
  const descInput = document.createElement("textarea");
  descInput.id = "category-description";
  descInput.name = "description";
  descInput.value = currentCategory.description || "";
  descInput.placeholder = "Describe this category's purpose...";
  descInput.rows = 2;
  descInput.addEventListener("input", () => {
    currentCategory.description = descInput.value.trim() || undefined;
    onChange(currentCategory);
  });

  const descGroup = createFormGroup("Description", descInput, "What types of tasks belong in this category?");
  form.appendChild(descGroup);

  // Model input
  const modelInput = document.createElement("input");
  modelInput.type = "text";
  modelInput.id = "category-model";
  modelInput.name = "model";
  modelInput.value = currentCategory.model || "";
  modelInput.placeholder = "e.g., claude-3-5-sonnet-20241022";
  modelInput.addEventListener("input", () => {
    currentCategory.model = modelInput.value.trim() || undefined;
    onChange(currentCategory);
  });

  const modelGroup = createFormGroup("Model", modelInput, "Default LLM model for this category");
  form.appendChild(modelGroup);

  // Temperature input
  const tempInput = document.createElement("input");
  tempInput.type = "number";
  tempInput.id = "category-temperature";
  tempInput.name = "temperature";
  tempInput.value = String(currentCategory.temperature ?? 0.5);
  tempInput.min = "0";
  tempInput.max = "2";
  tempInput.step = "0.1";
  tempInput.addEventListener("input", () => {
    const val = parseFloat(tempInput.value);
    currentCategory.temperature = isNaN(val) ? undefined : val;
    onChange(currentCategory);
  });

  const tempGroup = createFormGroup("Temperature", tempInput, "Temperature for tasks in this category");
  form.appendChild(tempGroup);

  // Max tokens input
  const maxTokensInput = document.createElement("input");
  maxTokensInput.type = "number";
  maxTokensInput.id = "category-maxtokens";
  maxTokensInput.name = "maxTokens";
  maxTokensInput.value = String(currentCategory.maxTokens ?? "");
  maxTokensInput.min = "1";
  maxTokensInput.step = "1";
  maxTokensInput.placeholder = "e.g., 4096";
  maxTokensInput.addEventListener("input", () => {
    const val = parseInt(maxTokensInput.value, 10);
    currentCategory.maxTokens = isNaN(val) ? undefined : val;
    onChange(currentCategory);
  });

  const maxTokensGroup = createFormGroup("Max Tokens", maxTokensInput, "Maximum tokens for this category");
  form.appendChild(maxTokensGroup);

  return form;
}

// ============================================================================
// SECTION 3: SKILLS
// ============================================================================

/**
 * Create a skill item DOM element
 *
 * @param path - The skill path
 * @param index - The index of the skill
 * @param onRemove - Callback when remove button is clicked
 * @returns The created DOM element
 */
function createSkillItem(
  path: string,
  index: number,
  onRemove: (index: number) => void,
): HTMLElement {
  const item = document.createElement("div");
  item.className = "config-item skill-item";
  item.setAttribute("data-skill-index", String(index));

  const itemContent = document.createElement("div");
  itemContent.className = "config-item-content";

  // Skill path display
  const pathEl = document.createElement("div");
  pathEl.className = "config-item-path";
  pathEl.textContent = path;

  itemContent.appendChild(pathEl);

  // Remove button
  const actionsEl = document.createElement("div");
  actionsEl.className = "config-item-actions";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-danger btn-sm";
  removeBtn.setAttribute("aria-label", `Remove skill ${path}`);
  removeBtn.innerHTML = `<span class="btn-icon">🗑️</span> Remove`;
  removeBtn.addEventListener("click", () => onRemove(index));

  actionsEl.appendChild(removeBtn);

  item.appendChild(itemContent);
  item.appendChild(actionsEl);

  return item;
}

/**
 * Render skills list in DOM
 *
 * @param container - The container element to render into
 * @param skills - The array of skill paths
 * @param onRemove - Callback when remove button is clicked
 */
function renderSkillsList(
  container: HTMLElement,
  skills: string[],
  onRemove: (index: number) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  container.innerHTML = "";

  if (skills.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "list-empty";
    emptyEl.innerHTML = `
      <p class="mb-md">No skills configured yet.</p>
      <p class="text-muted">Click "Add Skill" to add your first skill path.</p>
    `;
    container.appendChild(emptyEl);
    return;
  }

  for (let i = 0; i < skills.length; i++) {
    const item = createSkillItem(skills[i], i, onRemove);
    container.appendChild(item);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
  inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
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
 * Create a checkbox form group
 *
 * @param labelText - The label text
 * @param checkboxElement - The checkbox input
 * @param helpText - Optional help text
 * @returns The form group DOM element
 */
function createCheckboxGroup(
  labelText: string,
  checkboxElement: HTMLInputElement,
  helpText?: string,
): HTMLElement {
  const group = document.createElement("div");
  group.className = "form-group form-group-checkbox";

  const wrapper = document.createElement("label");
  wrapper.className = "checkbox-wrapper";

  wrapper.appendChild(checkboxElement);
  wrapper.appendChild(document.createTextNode(labelText));

  group.appendChild(wrapper);

  if (helpText) {
    const help = document.createElement("div");
    help.className = "form-help";
    help.textContent = helpText;
    group.appendChild(help);
  }

  return group;
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize agents configuration
 *
 * @param agents - Current agents configuration
 * @param onChange - Callback when configuration changes
 * @returns Object with update/destroy/getValue methods
 */
export function initializeAgents(
  agents: Record<string, AgentOverride>,
  onChange: (agents: Record<string, AgentOverride>) => void,
): {
  update: (agents: Record<string, AgentOverride>) => void;
  destroy: () => void;
  getValue: () => Record<string, AgentOverride>;
} {
  const container = document.getElementById("agents-list");

  if (!container) {
    throw new Error("Agents list container not found");
  }

  let currentAgents: Record<string, AgentOverride> = { ...agents };

  // Function to handle agent deletion
  const handleDelete = (key: string): void => {
    try {
      if (confirm(`Are you sure you want to delete agent "${key}"?`)) {
        const { [key]: deleted, ...remainingAgents } = currentAgents;
        currentAgents = Object.keys(remainingAgents).length > 0 ? remainingAgents : {};
        renderAgentsList(container, currentAgents, handleEdit, handleDelete);
        onChange(currentAgents);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Function to handle agent editing (simplified - prompts for key)
  const handleEdit = (key: string): void => {
    const currentAgent = currentAgents[key];
    if (!currentAgent) {
      return;
    }

    // For now, just show an alert - full modal could be added later
    alert(
      `Edit agent "${key}"\n\nModel: ${currentAgent.model || "default"}\nTemperature: ${currentAgent.temperature ?? 0.5}\n\n(Full edit modal coming soon)`,
    );
  };

  // Function to handle adding a new agent
  const handleAdd = (): void => {
    const key = prompt("Enter a name/key for the new agent:");

    if (!key || !key.trim()) {
      return;
    }

    const trimmedKey = key.trim();

    if (!isValidAgentKey(trimmedKey)) {
      alert("Agent name must contain only letters, numbers, hyphens, and underscores");
      return;
    }

    if (currentAgents[trimmedKey]) {
      alert(`Agent "${trimmedKey}" already exists`);
      return;
    }

    currentAgents = {
      ...currentAgents,
      [trimmedKey]: { ...DEFAULT_AGENT },
    };

    renderAgentsList(container, currentAgents, handleEdit, handleDelete);
    onChange(currentAgents);
  };

  // Add add button to panel header if it doesn't exist
  const panelHeader = container.closest(".config-panel")?.querySelector(".panel-header");
  if (panelHeader && !panelHeader.querySelector(".btn-add-agent")) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary btn-add-agent";
    addBtn.innerHTML = `<span class="btn-icon">+</span> Add Agent`;
    addBtn.addEventListener("click", handleAdd);
    panelHeader.appendChild(addBtn);
  }

  // Initial render
  renderAgentsList(container, currentAgents, handleEdit, handleDelete);

  return {
    update: (newAgents: Record<string, AgentOverride>): void => {
      currentAgents = { ...newAgents };
      renderAgentsList(container, currentAgents, handleEdit, handleDelete);
    },
    destroy: (): void => {
      const addBtn = panelHeader?.querySelector(".btn-add-agent");
      if (addBtn) {
        addBtn.remove();
      }
      container.innerHTML = "";
    },
    getValue: (): Record<string, AgentOverride> => ({ ...currentAgents }),
  };
}

/**
 * Initialize categories configuration
 *
 * @param categories - Current categories configuration
 * @param onChange - Callback when configuration changes
 * @returns Object with update/destroy/getValue methods
 */
export function initializeCategories(
  categories: Record<string, CategoryConfig>,
  onChange: (categories: Record<string, CategoryConfig>) => void,
): {
  update: (categories: Record<string, CategoryConfig>) => void;
  destroy: () => void;
  getValue: () => Record<string, CategoryConfig>;
} {
  const container = document.getElementById("categories-list");

  if (!container) {
    throw new Error("Categories list container not found");
  }

  let currentCategories: Record<string, CategoryConfig> = { ...categories };

  // Function to handle category deletion
  const handleDelete = (key: string): void => {
    try {
      if (confirm(`Are you sure you want to delete category "${key}"?`)) {
        const { [key]: deleted, ...remainingCategories } = currentCategories;
        currentCategories = Object.keys(remainingCategories).length > 0 ? remainingCategories : {};
        renderCategoriesList(container, currentCategories, handleEdit, handleDelete);
        onChange(currentCategories);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Function to handle category editing (simplified)
  const handleEdit = (key: string): void => {
    const currentCategory = currentCategories[key];
    if (!currentCategory) {
      return;
    }

    alert(
      `Edit category "${key}"\n\nDescription: ${currentCategory.description || "none"}\nModel: ${currentCategory.model || "default"}\n\n(Full edit modal coming soon)`,
    );
  };

  // Function to handle adding a new category
  const handleAdd = (): void => {
    const key = prompt("Enter a name/key for the new category:");

    if (!key || !key.trim()) {
      return;
    }

    const trimmedKey = key.trim();

    if (!isValidCategoryKey(trimmedKey)) {
      alert("Category name must contain only letters, numbers, hyphens, and underscores");
      return;
    }

    if (currentCategories[trimmedKey]) {
      alert(`Category "${trimmedKey}" already exists`);
      return;
    }

    currentCategories = {
      ...currentCategories,
      [trimmedKey]: { ...DEFAULT_CATEGORY },
    };

    renderCategoriesList(container, currentCategories, handleEdit, handleDelete);
    onChange(currentCategories);
  };

  // Add add button to panel header if it doesn't exist
  const panelHeader = container.closest(".config-panel")?.querySelector(".panel-header");
  if (panelHeader && !panelHeader.querySelector(".btn-add-category")) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary btn-add-category";
    addBtn.innerHTML = `<span class="btn-icon">+</span> Add Category`;
    addBtn.addEventListener("click", handleAdd);
    panelHeader.appendChild(addBtn);
  }

  // Initial render
  renderCategoriesList(container, currentCategories, handleEdit, handleDelete);

  return {
    update: (newCategories: Record<string, CategoryConfig>): void => {
      currentCategories = { ...newCategories };
      renderCategoriesList(container, currentCategories, handleEdit, handleDelete);
    },
    destroy: (): void => {
      const addBtn = panelHeader?.querySelector(".btn-add-category");
      if (addBtn) {
        addBtn.remove();
      }
      container.innerHTML = "";
    },
    getValue: (): Record<string, CategoryConfig> => ({ ...currentCategories }),
  };
}

/**
 * Initialize skills configuration
 *
 * @param skills - Current skills array
 * @param onChange - Callback when configuration changes
 * @returns Object with update/destroy/getValue methods
 */
export function initializeSkills(
  skills: string[],
  onChange: (skills: string[]) => void,
): {
  update: (skills: string[]) => void;
  destroy: () => void;
  getValue: () => string[];
} {
  const container = document.getElementById("skills-list");

  if (!container) {
    throw new Error("Skills list container not found");
  }

  let currentSkills: string[] = [...skills];

  // Function to handle skill removal
  const handleRemove = (index: number): void => {
    try {
      if (confirm(`Are you sure you want to remove skill "${currentSkills[index]}"?`)) {
        currentSkills = currentSkills.filter((_, i) => i !== index);
        renderSkillsList(container, currentSkills, handleRemove);
        onChange(currentSkills);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  // Function to handle adding a new skill
  const handleAdd = (): void => {
    const path = prompt("Enter the path to the skill file:");

    if (!path || !path.trim()) {
      return;
    }

    const trimmedPath = path.trim();

    if (currentSkills.includes(trimmedPath)) {
      alert("Skill path already exists");
      return;
    }

    currentSkills = [...currentSkills, trimmedPath];
    renderSkillsList(container, currentSkills, handleRemove);
    onChange(currentSkills);
  };

  // Add add button to panel header if it doesn't exist
  const panelHeader = container.closest(".config-panel")?.querySelector(".panel-header");
  if (panelHeader && !panelHeader.querySelector(".btn-add-skill")) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary btn-add-skill";
    addBtn.innerHTML = `<span class="btn-icon">+</span> Add Skill`;
    addBtn.addEventListener("click", handleAdd);
    panelHeader.appendChild(addBtn);
  }

  // Initial render
  renderSkillsList(container, currentSkills, handleRemove);

  return {
    update: (newSkills: string[]): void => {
      currentSkills = [...newSkills];
      renderSkillsList(container, currentSkills, handleRemove);
    },
    destroy: (): void => {
      const addBtn = panelHeader?.querySelector(".btn-add-skill");
      if (addBtn) {
        addBtn.remove();
      }
      container.innerHTML = "";
    },
    getValue: (): string[] => [...currentSkills],
  };
}
