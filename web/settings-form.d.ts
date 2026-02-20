/**
 * Settings Form Component
 *
 * Handles the form for editing global settings including
 * namespace, delegation, parallelization, model selection, and routing logger configuration.
 */
import type { Settings } from "./types";
/**
 * Create the settings form DOM element
 *
 * @param settings - Current settings configuration
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
export declare function createSettingsForm(settings: Settings, onChange: (config: Settings) => void): HTMLFormElement;
/**
 * Validate a settings configuration
 *
 * @param settings - The settings to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateSettings(settings: Settings): {
    isValid: boolean;
    error?: string;
};
/**
 * Render a settings form into a container
 *
 * @param container - The container element to render into
 * @param settings - Current settings configuration
 * @param onChange - Callback when form data changes
 */
export declare function renderSettingsForm(container: HTMLElement, settings: Settings, onChange: (config: Settings) => void): void;
/**
 * Initialize a settings form
 *
 * @param settings - Current settings configuration
 * @param onChange - Callback when form data changes
 * @returns Object with update/destroy methods
 */
export declare function initializeSettingsForm(settings: Settings, onChange: (config: Settings) => void): {
    update: (config: Settings) => void;
    destroy: () => void;
    getValue: () => Settings;
};
//# sourceMappingURL=settings-form.d.ts.map