/**
 * Preview Panel Component
 *
 * Provides live preview of routing behavior by testing sample prompts
 * against the configured meta-agent routing rules.
 */
import type { OlimpusConfig, MetaAgentDef, RoutingRule } from "./types";
/**
 * Preview result data structure
 */
export interface PreviewResult {
    matched: boolean;
    metaAgent?: string;
    targetAgent?: string;
    matchedRule?: RoutingRule;
    matchedReason?: string;
    configOverrides?: {
        model?: string;
        temperature?: number;
        prompt?: string;
        variant?: string;
    };
}
/**
 * Get all available meta-agents from config
 *
 * @param config - The Olimpus configuration
 * @returns Array of meta-agent names
 */
export declare function getMetaAgentNames(config: OlimpusConfig): string[];
/**
 * Evaluate a prompt against a specific meta-agent's routing rules
 *
 * @param metaAgent - The meta-agent definition
 * @param prompt - The sample prompt to test
 * @param projectFiles - Optional project files for project_context matcher
 * @param projectDeps - Optional project dependencies for project_context matcher
 * @returns The preview result
 */
export declare function evaluatePreview(metaAgent: MetaAgentDef, prompt: string, projectFiles?: string[], projectDeps?: string[]): PreviewResult;
/**
 * Create the preview result display DOM element
 *
 * @param result - The preview result to display
 * @param metaAgentName - The name of the meta-agent (optional)
 * @returns The created DOM element
 */
export declare function createPreviewResultElement(result: PreviewResult, metaAgentName?: string): HTMLElement;
/**
 * Render the preview result in the DOM
 *
 * @param container - The container element to render into
 * @param result - The preview result to display
 * @param metaAgentName - The name of the meta-agent (optional)
 */
export declare function renderPreviewResult(container: HTMLElement, result: PreviewResult, metaAgentName?: string): void;
/**
 * Clear the preview result and show placeholder
 *
 * @param container - The container element to clear
 */
export declare function clearPreviewResult(container: HTMLElement): void;
/**
 * Create meta-agent selector dropdown
 *
 * @param metaAgents - Array of meta-agent names
 * @param selectedMetaAgent - Currently selected meta-agent name
 * @param onChange - Callback when selection changes
 * @returns The created select element
 */
export declare function createMetaAgentSelector(metaAgents: string[], selectedMetaAgent: string | null, onChange: (metaAgentName: string | null) => void): HTMLElement;
/**
 * Initialize the preview panel component
 *
 * @param config - The current Olimpus configuration
 * @param onConfigChange - Callback when configuration changes
 * @returns Object with update, destroy, and other methods
 */
export declare function initializePreviewPanel(config: OlimpusConfig, onConfigChange: (newConfig: OlimpusConfig) => void): {
    update: (newConfig: OlimpusConfig) => void;
    updatePreview: () => void;
    setMetaAgent: (name: string | null) => void;
    getMetaAgent: () => string | null;
    destroy: () => void;
};
//# sourceMappingURL=preview-panel.d.ts.map