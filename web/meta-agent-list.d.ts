/**
 * Meta-Agent List Component
 *
 * Handles rendering and management of the meta-agents list including
 * add/delete functionality and DOM manipulation.
 */
import type { OlimpusConfig } from "./types";
/**
 * Render the meta-agents list in the DOM
 *
 * @param container - The container element to render into
 * @param config - The current Olimpus config
 * @param onDelete - Callback when a meta-agent is deleted
 */
export declare function renderMetaAgentList(container: HTMLElement, config: OlimpusConfig, onDelete: (name: string) => void): void;
/**
 * Add a new meta-agent to the configuration
 *
 * @param config - The current Olimpus config
 * @param name - The name/key for the new meta-agent
 * @returns Updated config with new meta-agent
 * @throws Error if name is invalid or already exists
 */
export declare function addMetaAgent(config: OlimpusConfig, name: string): OlimpusConfig;
/**
 * Delete a meta-agent from the configuration
 *
 * @param config - The current Olimpus config
 * @param name - The name/key of the meta-agent to delete
 * @returns Updated config without the deleted meta-agent
 * @throws Error if meta-agent does not exist
 */
export declare function deleteMetaAgent(config: OlimpusConfig, name: string): OlimpusConfig;
/**
 * Prompt user for a new meta-agent name
 *
 * @returns The entered name or null if cancelled
 */
export declare function promptForMetaAgentName(): string | null;
/**
 * Initialize the meta-agent list with event handlers
 *
 * @param config - The current Olimpus config
 * @param onConfigChange - Callback when configuration changes
 * @returns Object with cleanup function
 */
export declare function initializeMetaAgentList(config: OlimpusConfig, onConfigChange: (newConfig: OlimpusConfig) => void): {
    update: (newConfig: OlimpusConfig) => void;
    destroy: () => void;
};
//# sourceMappingURL=meta-agent-list.d.ts.map