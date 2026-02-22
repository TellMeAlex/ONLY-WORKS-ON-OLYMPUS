/**
 * Meta-Agent Form Component
 *
 * Handles the form for editing meta-agent configuration including
 * base_model, delegates_to (multi-select), and temperature.
 */
/**
 * Built-in agent names that can be selected as delegation targets
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
];
/**
 * Default values for form fields
 */
const DEFAULT_VALUES = {
    base_model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    delegates_to: [],
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
 * Create a checkbox group for multi-select delegates_to field
 *
 * @param selectedAgents - Currently selected agents
 * @param onChange - Callback when selection changes
 * @returns The checkbox group DOM element
 */
function createDelegateCheckboxGroup(selectedAgents, onChange) {
    const container = document.createElement("div");
    container.className = "delegate-checkbox-group";
    const label = document.createElement("div");
    label.className = "delegate-group-label";
    label.textContent = "Delegates To";
    container.appendChild(label);
    const help = document.createElement("div");
    help.className = "form-help";
    help.textContent = "Select the built-in agents this meta-agent can delegate to";
    container.appendChild(help);
    const checkboxesContainer = document.createElement("div");
    checkboxesContainer.className = "delegate-checkboxes";
    BUILTIN_AGENTS.forEach((agent) => {
        const checkboxWrapper = document.createElement("div");
        checkboxWrapper.className = "delegate-checkbox-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `delegate-${agent}`;
        checkbox.value = agent;
        checkbox.checked = selectedAgents.includes(agent);
        checkbox.addEventListener("change", () => {
            const checkedBoxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
            const selected = Array.from(checkedBoxes).map((cb) => cb.value);
            onChange(selected);
        });
        const agentLabel = document.createElement("label");
        agentLabel.htmlFor = `delegate-${agent}`;
        agentLabel.textContent = agent;
        agentLabel.className = "delegate-checkbox-label";
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(agentLabel);
        checkboxesContainer.appendChild(checkboxWrapper);
    });
    container.appendChild(checkboxesContainer);
    return container;
}
/**
 * Create the meta-agent form DOM element
 *
 * @param metaAgentDef - Current meta-agent definition
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
export function createMetaAgentForm(metaAgentDef, onChange) {
    const form = document.createElement("form");
    form.className = "meta-agent-form";
    form.addEventListener("submit", (e) => e.preventDefault());
    // Base model input
    const baseModelInput = document.createElement("input");
    baseModelInput.type = "text";
    baseModelInput.id = "base-model-input";
    baseModelInput.name = "base_model";
    baseModelInput.value = metaAgentDef.base_model || DEFAULT_VALUES.base_model;
    baseModelInput.placeholder = "e.g., claude-3-5-sonnet-20241022";
    baseModelInput.required = true;
    baseModelInput.addEventListener("input", () => {
        onChange({
            ...metaAgentDef,
            base_model: baseModelInput.value.trim(),
        });
    });
    const baseModelGroup = createFormGroup("Base Model", baseModelInput, "The LLM model used by this meta-agent");
    form.appendChild(baseModelGroup);
    // Delegates to checkbox group
    const delegateGroup = createDelegateCheckboxGroup(metaAgentDef.delegates_to, (selected) => {
        onChange({
            ...metaAgentDef,
            delegates_to: selected,
        });
    });
    form.appendChild(delegateGroup);
    // Temperature input
    const tempInput = document.createElement("input");
    tempInput.type = "number";
    tempInput.id = "temperature-input";
    tempInput.name = "temperature";
    tempInput.value = String(metaAgentDef.temperature ?? DEFAULT_VALUES.temperature);
    tempInput.min = "0";
    tempInput.max = "2";
    tempInput.step = "0.1";
    tempInput.placeholder = "0.7";
    tempInput.addEventListener("input", () => {
        const value = parseFloat(tempInput.value);
        onChange({
            ...metaAgentDef,
            temperature: isNaN(value) ? undefined : value,
        });
    });
    const tempGroup = createFormGroup("Temperature", tempInput, "Controls randomness: 0 = deterministic, 1 = balanced, 2 = creative (optional)");
    form.appendChild(tempGroup);
    return form;
}
/**
 * Validate a meta-agent definition
 *
 * @param def - The meta-agent definition to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateMetaAgentDef(def) {
    if (!def.base_model || def.base_model.trim() === "") {
        return { isValid: false, error: "Base model is required" };
    }
    if (!def.delegates_to || def.delegates_to.length === 0) {
        return { isValid: false, error: "At least one delegate agent must be selected" };
    }
    // Check if all delegates are valid builtin agents
    for (const agent of def.delegates_to) {
        if (!BUILTIN_AGENTS.includes(agent)) {
            return {
                isValid: false,
                error: `Invalid delegate agent: ${agent}. Must be one of: ${BUILTIN_AGENTS.join(", ")}`,
            };
        }
    }
    if (def.temperature !== undefined) {
        if (def.temperature < 0 || def.temperature > 2) {
            return {
                isValid: false,
                error: "Temperature must be between 0 and 2",
            };
        }
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
 * Create a meta-agent form with validation display
 *
 * @param metaAgentDef - Current meta-agent definition
 * @param onChange - Callback when form data changes
 * @param onSave - Callback when save is triggered
 * @returns Object with form element and validation method
 */
export function createMetaAgentFormWithValidation(metaAgentDef, onChange, onSave) {
    const container = document.createElement("div");
    container.className = "meta-agent-form-container";
    const form = createMetaAgentForm(metaAgentDef, (updatedDef) => {
        onChange(updatedDef);
        currentDef = updatedDef;
    });
    const errorContainer = document.createElement("div");
    errorContainer.className = "form-error-container";
    container.appendChild(errorContainer);
    container.appendChild(form);
    let currentDef = { ...metaAgentDef };
    const validate = () => {
        const result = validateMetaAgentDef(currentDef);
        errorContainer.innerHTML = "";
        if (!result.isValid && result.error) {
            errorContainer.appendChild(createValidationError(result.error));
            return false;
        }
        return true;
    };
    const getValue = () => ({ ...currentDef });
    return { form: container, validate, getValue };
}
/**
 * Render a meta-agent form into a container
 *
 * @param container - The container element to render into
 * @param metaAgentDef - Current meta-agent definition
 * @param onChange - Callback when form data changes
 */
export function renderMetaAgentForm(container, metaAgentDef, onChange) {
    if (!container) {
        throw new Error("Container element is required");
    }
    container.innerHTML = "";
    const form = createMetaAgentForm(metaAgentDef, onChange);
    container.appendChild(form);
}
/**
 * Initialize a meta-agent form with edit mode
 *
 * @param metaAgentName - The name of the meta-agent being edited
 * @param metaAgentDef - Current meta-agent definition
 * @param onSave - Callback when save is triggered
 * @param onCancel - Callback when cancel is triggered
 * @returns Object with update method
 */
export function initializeMetaAgentForm(metaAgentName, metaAgentDef, onSave, onCancel) {
    const container = document.getElementById("meta-agent-form-container");
    if (!container) {
        throw new Error("Meta-agent form container not found");
    }
    let currentDef = { ...metaAgentDef };
    const handleOnChange = (updatedDef) => {
        currentDef = updatedDef;
    };
    const { form, validate, getValue } = createMetaAgentFormWithValidation(currentDef, handleOnChange, () => { });
    // Add action buttons
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "form-actions";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
        if (validate()) {
            onSave(metaAgentName, getValue());
        }
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", onCancel);
    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(cancelBtn);
    container.innerHTML = "";
    container.appendChild(form);
    container.appendChild(actionsContainer);
    return {
        update: (def) => {
            currentDef = def;
            // Re-render form with updated values
            container.innerHTML = "";
            const { form: newForm } = createMetaAgentFormWithValidation(currentDef, handleOnChange, () => { });
            const newActionsContainer = document.createElement("div");
            newActionsContainer.className = "form-actions";
            const newSaveBtn = document.createElement("button");
            newSaveBtn.type = "button";
            newSaveBtn.className = "btn btn-primary";
            newSaveBtn.textContent = "Save";
            newSaveBtn.addEventListener("click", () => {
                if (validate()) {
                    onSave(metaAgentName, getValue());
                }
            });
            const newCancelBtn = document.createElement("button");
            newCancelBtn.type = "button";
            newCancelBtn.className = "btn btn-secondary";
            newCancelBtn.textContent = "Cancel";
            newCancelBtn.addEventListener("click", onCancel);
            newActionsContainer.appendChild(newSaveBtn);
            newActionsContainer.appendChild(newCancelBtn);
            container.appendChild(newForm);
            container.appendChild(newActionsContainer);
        },
        destroy: () => {
            container.innerHTML = "";
        },
    };
}
//# sourceMappingURL=meta-agent-form.js.map