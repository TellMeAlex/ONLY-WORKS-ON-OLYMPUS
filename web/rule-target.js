/**
 * Rule Target Component
 *
 * Handles the target agent selector and optional config overrides for routing rules.
 * This includes selecting which agent to route to and optionally overriding model,
 * temperature, prompt, and variant settings.
 */
/**
 * Built-in agent names that can be selected as routing targets
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
 * Default config overrides values
 */
const DEFAULT_CONFIG_OVERRIDES = {
    model: undefined,
    temperature: undefined,
    prompt: undefined,
    variant: undefined,
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
// ===================================
// Target Agent Selector
// ===================================
/**
 * Create a target agent selector dropdown
 *
 * @param targetAgent - Currently selected target agent
 * @param onChange - Callback when selection changes
 * @returns The form group DOM element
 */
export function createTargetAgentSelector(targetAgent, onChange) {
    const select = document.createElement("select");
    select.id = "target-agent-selector";
    select.name = "target_agent";
    select.required = true;
    // Add default empty option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select an agent...";
    defaultOption.selected = !targetAgent;
    select.appendChild(defaultOption);
    // Add builtin agent options
    BUILTIN_AGENTS.forEach((agent) => {
        const option = document.createElement("option");
        option.value = agent;
        option.textContent = agent;
        if (targetAgent === agent) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    select.addEventListener("change", () => {
        onChange(select.value);
    });
    const group = createFormGroup("Target Agent", select, "Select which agent this rule routes to");
    return group;
}
/**
 * Validate a target agent
 *
 * @param targetAgent - The target agent to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateTargetAgent(targetAgent) {
    if (!targetAgent || targetAgent.trim() === "") {
        return { isValid: false, error: "Target agent is required" };
    }
    if (!BUILTIN_AGENTS.includes(targetAgent)) {
        return {
            isValid: false,
            error: `Invalid target agent. Must be one of: ${BUILTIN_AGENTS.join(", ")}`,
        };
    }
    return { isValid: true };
}
// ===================================
// Config Overrides Form
// ===================================
/**
 * Create a toggle switch for enabling config overrides
 *
 * @param enabled - Whether overrides are currently enabled
 * @param onChange - Callback when toggle changes
 * @returns The toggle container DOM element
 */
function createConfigOverridesToggle(enabled, onChange) {
    const container = document.createElement("div");
    container.className = "config-overrides-toggle";
    const label = document.createElement("label");
    label.className = "config-overrides-toggle-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "config-overrides-enabled";
    checkbox.checked = enabled;
    checkbox.addEventListener("change", () => {
        onChange(checkbox.checked);
    });
    const labelText = document.createElement("span");
    labelText.textContent = "Enable Config Overrides";
    label.appendChild(checkbox);
    label.appendChild(labelText);
    const help = document.createElement("div");
    help.className = "form-help";
    help.textContent = "Optionally override model settings for this rule";
    container.appendChild(label);
    container.appendChild(help);
    return container;
}
/**
 * Create config overrides form
 *
 * @param overrides - Current config overrides
 * @param onChange - Callback when overrides change
 * @returns The form DOM element
 */
export function createConfigOverridesForm(overrides, onChange) {
    const form = document.createElement("form");
    form.className = "config-overrides-form";
    form.addEventListener("submit", (e) => e.preventDefault());
    // Model override input
    const modelInput = document.createElement("input");
    modelInput.type = "text";
    modelInput.id = "config-override-model";
    modelInput.name = "model";
    modelInput.value = overrides.model || "";
    modelInput.placeholder = "e.g., claude-3-5-sonnet-20241022";
    modelInput.addEventListener("input", () => {
        const value = modelInput.value.trim();
        onChange({
            ...overrides,
            model: value || undefined,
        });
    });
    const modelGroup = createFormGroup("Model Override", modelInput, "Override the model name (optional)");
    form.appendChild(modelGroup);
    // Temperature override input
    const tempInput = document.createElement("input");
    tempInput.type = "number";
    tempInput.id = "config-override-temperature";
    tempInput.name = "temperature";
    tempInput.value = overrides.temperature !== undefined ? String(overrides.temperature) : "";
    tempInput.min = "0";
    tempInput.max = "2";
    tempInput.step = "0.1";
    tempInput.placeholder = "0.7";
    tempInput.addEventListener("input", () => {
        const value = parseFloat(tempInput.value);
        onChange({
            ...overrides,
            temperature: isNaN(value) ? undefined : value,
        });
    });
    const tempGroup = createFormGroup("Temperature Override", tempInput, "Override the temperature: 0 = deterministic, 1 = balanced, 2 = creative (optional)");
    form.appendChild(tempGroup);
    // Prompt override textarea
    const promptTextarea = document.createElement("textarea");
    promptTextarea.id = "config-override-prompt";
    promptTextarea.name = "prompt";
    promptTextarea.value = overrides.prompt || "";
    promptTextarea.placeholder = "e.g., Be concise and focus on...";
    promptTextarea.rows = 3;
    promptTextarea.addEventListener("input", () => {
        const value = promptTextarea.value.trim();
        onChange({
            ...overrides,
            prompt: value || undefined,
        });
    });
    const promptGroup = createFormGroup("Prompt Override", promptTextarea, "Override the system prompt (optional)");
    form.appendChild(promptGroup);
    // Variant override input
    const variantInput = document.createElement("input");
    variantInput.type = "text";
    variantInput.id = "config-override-variant";
    variantInput.name = "variant";
    variantInput.value = overrides.variant || "";
    variantInput.placeholder = "e.g., specific-variant";
    variantInput.addEventListener("input", () => {
        const value = variantInput.value.trim();
        onChange({
            ...overrides,
            variant: value || undefined,
        });
    });
    const variantGroup = createFormGroup("Variant Override", variantInput, "Override the model variant (optional)");
    form.appendChild(variantGroup);
    return form;
}
/**
 * Validate config overrides
 *
 * @param overrides - The config overrides to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateConfigOverrides(overrides) {
    // Config overrides are always valid since all fields are optional
    // Individual field validation is handled by their input constraints
    if (overrides.temperature !== undefined) {
        if (overrides.temperature < 0 || overrides.temperature > 2) {
            return {
                isValid: false,
                error: "Temperature override must be between 0 and 2",
            };
        }
    }
    return { isValid: true };
}
// ===================================
// Combined Rule Target Form
// ===================================
/**
 * Create a combined rule target form with agent selector and optional overrides
 *
 * @param targetAgent - Currently selected target agent
 * @param overrides - Current config overrides (undefined if disabled)
 * @param onTargetChange - Callback when target agent changes
 * @param onOverridesChange - Callback when overrides change
 * @returns The form container DOM element
 */
export function createRuleTargetForm(targetAgent, overrides, onTargetChange, onOverridesChange) {
    const container = document.createElement("div");
    container.className = "rule-target-form";
    // Target agent selector
    const targetSelector = createTargetAgentSelector(targetAgent, onTargetChange);
    container.appendChild(targetSelector);
    // Config overrides toggle and form
    const overridesContainer = document.createElement("div");
    overridesContainer.className = "config-overrides-container";
    const overridesEnabled = overrides !== undefined;
    const toggle = createConfigOverridesToggle(overridesEnabled, (enabled) => {
        if (enabled) {
            onOverridesChange({ ...DEFAULT_CONFIG_OVERRIDES });
            overridesFormContainer.classList.remove("hidden");
        }
        else {
            onOverridesChange(undefined);
            overridesFormContainer.classList.add("hidden");
        }
    });
    overridesContainer.appendChild(toggle);
    const overridesFormContainer = document.createElement("div");
    overridesFormContainer.className = "config-overrides-form-container";
    if (!overridesEnabled) {
        overridesFormContainer.classList.add("hidden");
    }
    if (overridesEnabled) {
        const overridesForm = createConfigOverridesForm(overrides, onOverridesChange);
        overridesFormContainer.appendChild(overridesForm);
    }
    overridesContainer.appendChild(overridesFormContainer);
    container.appendChild(overridesContainer);
    return container;
}
// ===================================
// Initialize Pattern
// ===================================
/**
 * Initialize a rule target form with update/destroy methods
 *
 * @param containerId - The ID of the container element
 * @param targetAgent - Initial target agent
 * @param overrides - Initial config overrides (undefined if disabled)
 * @param onTargetChange - Callback when target agent changes
 * @param onOverridesChange - Callback when overrides change
 * @returns Object with update, validate, getTarget, and getOverrides methods
 */
export function initializeRuleTargetForm(containerId, targetAgent, overrides, onTargetChange, onOverridesChange) {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container element with ID "${containerId}" not found`);
    }
    let currentTarget = targetAgent;
    let currentOverrides = overrides;
    const handleTargetChange = (newTarget) => {
        currentTarget = newTarget;
        onTargetChange(newTarget);
    };
    const handleOverridesChange = (newOverrides) => {
        currentOverrides = newOverrides;
        onOverridesChange(newOverrides);
    };
    const form = createRuleTargetForm(currentTarget, currentOverrides, handleTargetChange, handleOverridesChange);
    container.appendChild(form);
    const validate = () => {
        const errors = [];
        const targetResult = validateTargetAgent(currentTarget);
        if (!targetResult.isValid && targetResult.error) {
            errors.push(targetResult.error);
        }
        if (currentOverrides) {
            const overridesResult = validateConfigOverrides(currentOverrides);
            if (!overridesResult.isValid && overridesResult.error) {
                errors.push(overridesResult.error);
            }
        }
        return { isValid: errors.length === 0, errors };
    };
    const getTarget = () => currentTarget;
    const getOverrides = () => currentOverrides;
    return {
        update: (newTarget, newOverrides) => {
            currentTarget = newTarget;
            currentOverrides = newOverrides;
            container.innerHTML = "";
            const newForm = createRuleTargetForm(currentTarget, currentOverrides, handleTargetChange, handleOverridesChange);
            container.appendChild(newForm);
        },
        validate,
        getTarget,
        getOverrides,
        destroy: () => {
            container.innerHTML = "";
        },
    };
}
/**
 * Render a rule target form into a container
 *
 * @param container - The container element to render into
 * @param targetAgent - Current target agent
 * @param overrides - Current config overrides (undefined if disabled)
 * @param onTargetChange - Callback when target agent changes
 * @param onOverridesChange - Callback when overrides change
 * @throws Error if container is not found
 */
export function renderRuleTargetForm(container, targetAgent, overrides, onTargetChange, onOverridesChange) {
    if (!container) {
        throw new Error("Container element is required");
    }
    container.innerHTML = "";
    const form = createRuleTargetForm(targetAgent, overrides, onTargetChange, onOverridesChange);
    container.appendChild(form);
}
//# sourceMappingURL=rule-target.js.map