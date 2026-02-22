/**
 * Meta-Agent Form Component
 *
 * Handles the form for editing meta-agent configuration including
 * base_model, delegates_to (multi-select), and temperature.
 */
import type { MetaAgentDef } from "./types";
/**
 * Create the meta-agent form DOM element
 *
 * @param metaAgentDef - Current meta-agent definition
 * @param onChange - Callback when form data changes
 * @returns The form DOM element
 */
export declare function createMetaAgentForm(metaAgentDef: MetaAgentDef, onChange: (def: MetaAgentDef) => void): HTMLFormElement;
/**
 * Validate a meta-agent definition
 *
 * @param def - The meta-agent definition to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateMetaAgentDef(def: MetaAgentDef): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a meta-agent form with validation display
 *
 * @param metaAgentDef - Current meta-agent definition
 * @param onChange - Callback when form data changes
 * @param onSave - Callback when save is triggered
 * @returns Object with form element and validation method
 */
export declare function createMetaAgentFormWithValidation(metaAgentDef: MetaAgentDef, onChange: (def: MetaAgentDef) => void, onSave: (def: MetaAgentDef) => void): {
    form: HTMLElement;
    validate: () => boolean;
    getValue: () => MetaAgentDef;
};
/**
 * Render a meta-agent form into a container
 *
 * @param container - The container element to render into
 * @param metaAgentDef - Current meta-agent definition
 * @param onChange - Callback when form data changes
 */
export declare function renderMetaAgentForm(container: HTMLElement, metaAgentDef: MetaAgentDef, onChange: (def: MetaAgentDef) => void): void;
/**
 * Initialize a meta-agent form with edit mode
 *
 * @param metaAgentName - The name of the meta-agent being edited
 * @param metaAgentDef - Current meta-agent definition
 * @param onSave - Callback when save is triggered
 * @param onCancel - Callback when cancel is triggered
 * @returns Object with update method
 */
export declare function initializeMetaAgentForm(metaAgentName: string, metaAgentDef: MetaAgentDef, onSave: (name: string, def: MetaAgentDef) => void, onCancel: () => void): {
    update: (def: MetaAgentDef) => void;
    destroy: () => void;
};
//# sourceMappingURL=meta-agent-form.d.ts.map