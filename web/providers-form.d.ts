/**
 * Providers Form Component
 *
 * Handles the form for editing provider configuration including
 * priority_chain, research_providers, strategy_providers, and per-provider config.
 */
import type { ProviderConfig } from "./types";
/**
 * Create the providers form DOM element
 *
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
export declare function createProvidersForm(providerConfig: ProviderConfig, onChange: (config: ProviderConfig) => void): HTMLFormElement;
/**
 * Validate a provider configuration
 *
 * @param config - The provider configuration to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateProviderConfig(config: ProviderConfig): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a providers form with validation display
 *
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 * @param onSave - Callback when save is triggered
 * @returns Object with form element and validation method
 */
export declare function createProvidersFormWithValidation(providerConfig: ProviderConfig, onChange: (config: ProviderConfig) => void, onSave: (config: ProviderConfig) => void): {
    form: HTMLElement;
    validate: () => boolean;
    getValue: () => ProviderConfig;
};
/**
 * Render a providers form into a container
 *
 * @param container - The container element to render into
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 */
export declare function renderProvidersForm(container: HTMLElement, providerConfig: ProviderConfig, onChange: (config: ProviderConfig) => void): void;
/**
 * Initialize a providers form
 *
 * @param providerConfig - Current provider configuration
 * @param onChange - Callback when form data changes
 * @returns Object with update/destroy methods
 */
export declare function initializeProvidersForm(providerConfig: ProviderConfig, onChange: (config: ProviderConfig) => void): {
    update: (config: ProviderConfig) => void;
    destroy: () => void;
    getValue: () => ProviderConfig;
};
//# sourceMappingURL=providers-form.d.ts.map