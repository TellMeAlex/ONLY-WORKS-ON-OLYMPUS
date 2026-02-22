/**
 * Rule Target Component
 *
 * Handles the target agent selector and optional config overrides for routing rules.
 * This includes selecting which agent to route to and optionally overriding model,
 * temperature, prompt, and variant settings.
 */
import type { ConfigOverrides } from "./types";
/**
 * Create a target agent selector dropdown
 *
 * @param targetAgent - Currently selected target agent
 * @param onChange - Callback when selection changes
 * @returns The form group DOM element
 */
export declare function createTargetAgentSelector(targetAgent: string, onChange: (targetAgent: string) => void): HTMLElement;
/**
 * Validate a target agent
 *
 * @param targetAgent - The target agent to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateTargetAgent(targetAgent: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Create config overrides form
 *
 * @param overrides - Current config overrides
 * @param onChange - Callback when overrides change
 * @returns The form DOM element
 */
export declare function createConfigOverridesForm(overrides: ConfigOverrides, onChange: (overrides: ConfigOverrides) => void): HTMLFormElement;
/**
 * Validate config overrides
 *
 * @param overrides - The config overrides to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateConfigOverrides(overrides: ConfigOverrides): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a combined rule target form with agent selector and optional overrides
 *
 * @param targetAgent - Currently selected target agent
 * @param overrides - Current config overrides (undefined if disabled)
 * @param onTargetChange - Callback when target agent changes
 * @param onOverridesChange - Callback when overrides change
 * @returns The form container DOM element
 */
export declare function createRuleTargetForm(targetAgent: string, overrides: ConfigOverrides | undefined, onTargetChange: (targetAgent: string) => void, onOverridesChange: (overrides: ConfigOverrides | undefined) => void): HTMLElement;
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
export declare function initializeRuleTargetForm(containerId: string, targetAgent: string, overrides: ConfigOverrides | undefined, onTargetChange: (targetAgent: string) => void, onOverridesChange: (overrides: ConfigOverrides | undefined) => void): {
    update: (targetAgent: string, overrides: ConfigOverrides | undefined) => void;
    validate: () => {
        isValid: boolean;
        errors: string[];
    };
    getTarget: () => string;
    getOverrides: () => ConfigOverrides | undefined;
    destroy: () => void;
};
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
export declare function renderRuleTargetForm(container: HTMLElement, targetAgent: string, overrides: ConfigOverrides | undefined, onTargetChange: (targetAgent: string) => void, onOverridesChange: (overrides: ConfigOverrides | undefined) => void): void;
//# sourceMappingURL=rule-target.d.ts.map