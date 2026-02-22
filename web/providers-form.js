/**
 * Providers Form Component
 *
 * Handles the form for editing provider configuration including
 * priority_chain, research_providers, strategy_providers, and per-provider config.
 */
/**
 * Default values for provider configuration
 */
const DEFAULT_PROVIDER_CONFIG = {
    priority_chain: [],
    research_providers: [],
    strategy_providers: [],
    config: {},
};
/**
 * Create a form group with label and input
 *
 * @param labelText - The label text
 * @param inputElement - The input element
 * @param helpText - Optional help text
 * @returns The form group DOM element
 */
function createFormGroup(labelText, inputElement, helpText) {
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
 * Create a tag input field for entering comma-separated values
 *
 * @param id - Input element ID
 * @param values - Current array of values
 * @param placeholder - Placeholder text
 * @param onChange - Callback when values change
 * @returns The input element
 */
function createTagInput(id, values, placeholder, onChange) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.name = id;
    input.value = values.join(", ");
    input.placeholder = placeholder;
    input.addEventListener("input", () => {
        const text = input.value.trim();
        const newValues = text === "" ? [] : text.split(",").map((v) => v.trim()).filter((v) => v !== "");
        onChange(newValues);
    });
    return input;
}
/**
 * Create a provider config section for editing per-provider settings
 *
 * @param providerConfig - Current provider configuration object
 * @param onChange - Callback when config changes
 * @returns The provider config DOM element
 */
function createProviderConfigSection(providerConfig, onChange) {
    const container = document.createElement("div");
    container.className = "provider-config-container";
    const header = document.createElement("div");
    header.className = "provider-config-header";
    const title = document.createElement("h3");
    title.textContent = "Provider Settings";
    title.className = "provider-config-title";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "btn btn-secondary btn-sm";
    addButton.textContent = "+ Add Provider";
    header.appendChild(title);
    header.appendChild(addButton);
    container.appendChild(header);
    const entriesContainer = document.createElement("div");
    container.appendChild(entriesContainer);
    /**
     * Render provider entries
     */
    function renderEntries() {
        entriesContainer.innerHTML = "";
        const providerNames = Object.keys(providerConfig);
        if (providerNames.length === 0) {
            const empty = document.createElement("div");
            empty.className = "provider-config-empty";
            empty.textContent = "No provider settings configured";
            entriesContainer.appendChild(empty);
            return;
        }
        for (const providerName of providerNames) {
            const entry = document.createElement("div");
            entry.className = "provider-config-entry";
            // Provider name display
            const nameDisplay = document.createElement("div");
            nameDisplay.className = "provider-config-name";
            nameDisplay.textContent = providerName;
            // Config values textarea (JSON format)
            const configValues = providerConfig[providerName];
            const configText = JSON.stringify(configValues, null, 2);
            const configInput = document.createElement("textarea");
            configInput.className = "provider-config-input";
            configInput.value = configText;
            configInput.placeholder = '{"key": "value"}';
            configInput.rows = 3;
            configInput.addEventListener("input", () => {
                try {
                    const newConfig = configInput.value.trim() === "" ? {} : JSON.parse(configInput.value);
                    onChange({
                        ...providerConfig,
                        [providerName]: newConfig,
                    });
                }
                catch {
                    // Invalid JSON, don't update
                }
            });
            // Remove button
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "btn btn-danger btn-sm provider-config-remove";
            removeButton.textContent = "×";
            removeButton.setAttribute("aria-label", `Remove ${providerName}`);
            removeButton.addEventListener("click", () => {
                const newConfig = { ...providerConfig };
                delete newConfig[providerName];
                onChange(newConfig);
            });
            entry.appendChild(nameDisplay);
            entry.appendChild(configInput);
            entry.appendChild(removeButton);
            entriesContainer.appendChild(entry);
        }
    }
    /**
     * Add a new provider config entry
     */
    addButton.addEventListener("click", () => {
        const providerName = prompt("Enter provider name (e.g., anthropic, openai, google):");
        if (providerName && providerName.trim() !== "") {
            const trimmedName = providerName.trim();
            if (providerConfig[trimmedName]) {
                alert(`Provider "${trimmedName}" already exists`);
                return;
            }
            onChange({
                ...providerConfig,
                [trimmedName]: { retry_on_rate_limit: true },
            });
        }
    });
    renderEntries();
    return container;
}
/**
 * Create the providers form DOM element
 *
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
export function createProvidersForm(providerConfig, onChange) {
    const form = document.createElement("form");
    form.className = "providers-form";
    form.addEventListener("submit", (e) => e.preventDefault());
    const config = {
        priority_chain: providerConfig.priority_chain ?? DEFAULT_PROVIDER_CONFIG.priority_chain,
        research_providers: providerConfig.research_providers ?? DEFAULT_PROVIDER_CONFIG.research_providers,
        strategy_providers: providerConfig.strategy_providers ?? DEFAULT_PROVIDER_CONFIG.strategy_providers,
        config: providerConfig.config ?? DEFAULT_PROVIDER_CONFIG.config,
    };
    // Priority chain input
    const priorityChainInput = createTagInput("priority-chain", config.priority_chain, "e.g., anthropic/claude-opus-4-6, openai/gpt-5.2, google/gemini-3-pro", (values) => {
        onChange({
            ...config,
            priority_chain: values,
        });
    });
    const priorityChainGroup = createFormGroup("Priority Chain", priorityChainInput, "Providers tried in order until one is available. Format: provider/model-name");
    form.appendChild(priorityChainGroup);
    // Research providers input
    const researchProvidersInput = createTagInput("research-providers", config.research_providers, "e.g., anthropic/claude-haiku-4-5, openai/gpt-4-turbo", (values) => {
        onChange({
            ...config,
            research_providers: values,
        });
    });
    const researchProvidersGroup = createFormGroup("Research Providers", researchProvidersInput, "Cheaper models used for background research and search tasks");
    form.appendChild(researchProvidersGroup);
    // Strategy providers input
    const strategyProvidersInput = createTagInput("strategy-providers", config.strategy_providers, "e.g., anthropic/claude-opus-4-6, openai/gpt-5.2", (values) => {
        onChange({
            ...config,
            strategy_providers: values,
        });
    });
    const strategyProvidersGroup = createFormGroup("Strategy Providers", strategyProvidersInput, "Expensive models used for strategic decisions and complex analysis");
    form.appendChild(strategyProvidersGroup);
    // Provider config section
    const providerConfigSection = createProviderConfigSection(config.config, (newConfig) => {
        onChange({
            ...config,
            config: newConfig,
        });
    });
    form.appendChild(providerConfigSection);
    return form;
}
/**
 * Validate a provider configuration
 *
 * @param config - The provider configuration to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateProviderConfig(config) {
    // Provider config is optional and can be empty
    if (!config) {
        return { isValid: true };
    }
    // Validate provider strings are in correct format (provider/model)
    const validateProviderStrings = (providers, fieldName) => {
        if (providers) {
            for (const provider of providers) {
                if (typeof provider !== "string" || provider.trim() === "") {
                    throw new Error(`${fieldName} contains empty or invalid provider string`);
                }
            }
        }
    };
    try {
        validateProviderStrings(config.priority_chain, "Priority chain");
        validateProviderStrings(config.research_providers, "Research providers");
        validateProviderStrings(config.strategy_providers, "Strategy providers");
    }
    catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
    return { isValid: true };
}
/**
 * Create a form validation error display
 *
 * @param error - The error message
 * @returns The error display DOM element
 */
function createValidationError(error) {
    const errorEl = document.createElement("div");
    errorEl.className = "form-validation-error";
    errorEl.textContent = error;
    return errorEl;
}
/**
 * Create a providers form with validation display
 *
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 * @param onSave - Callback when save is triggered
 * @returns Object with form element and validation method
 */
export function createProvidersFormWithValidation(providerConfig, onChange, onSave) {
    const container = document.createElement("div");
    container.className = "providers-form-container";
    const form = createProvidersForm(providerConfig, (updatedConfig) => {
        onChange(updatedConfig);
        currentConfig = updatedConfig;
    });
    const errorContainer = document.createElement("div");
    errorContainer.className = "form-error-container";
    container.appendChild(errorContainer);
    container.appendChild(form);
    // Add action buttons
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "form-actions";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
        if (validate()) {
            onSave(currentConfig);
        }
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", onCancel);
    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(cancelBtn);
    container.appendChild(actionsContainer);
    let currentConfig = { ...providerConfig };
    const validate = () => {
        const result = validateProviderConfig(currentConfig);
        errorContainer.innerHTML = "";
        if (!result.isValid && result.error) {
            errorContainer.appendChild(createValidationError(result.error));
            return false;
        }
        return true;
    };
    const getValue = () => ({ ...currentConfig });
    return { form: container, validate, getValue };
}
/**
 * Render a providers form into a container
 *
 * @param container - The container element to render into
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 */
export function renderProvidersForm(container, providerConfig, onChange) {
    if (!container) {
        throw new Error("Container element is required");
    }
    container.innerHTML = "";
    const form = createProvidersForm(providerConfig, onChange);
    container.appendChild(form);
}
/**
 * Initialize a providers form
 *
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 * @returns Object with update/destroy methods
 */
export function initializeProvidersForm(providerConfig, onChange) {
    const container = document.getElementById("providers-list");
    if (!container) {
        throw new Error("Providers list container not found");
    }
    let currentConfig = { ...providerConfig };
    const handleOnChange = (updatedConfig) => {
        currentConfig = updatedConfig;
        onChange(updatedConfig);
    };
    const render = () => {
        container.innerHTML = "";
        const form = createProvidersForm(currentConfig, handleOnChange);
        container.appendChild(form);
    };
    render();
    return {
        update: (newConfig) => {
            currentConfig = { ...newConfig };
            render();
        },
        destroy: () => {
            container.innerHTML = "";
        },
        getValue: () => ({ ...currentConfig }),
    };
}
//# sourceMappingURL=providers-form.js.map