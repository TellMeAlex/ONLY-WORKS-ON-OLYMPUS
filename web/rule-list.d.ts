/**
 * Routing Rule List Component
 *
 * Handles rendering and management of routing rules including
 * display, reorder (drag-and-drop), and add/delete functionality.
 */
import type { OlimpusConfig } from "./types";
/**
 * Current meta-agent context for the rule list
 */
interface RuleListContext {
    metaAgentName: string;
    config: OlimpusConfig;
}
/**
 * Render the routing rules list in the DOM
 *
 * @param container - The container element to render into
 * @param context - The rule list context
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @param onReorder - Callback when rules are reordered
 */
export declare function renderRuleList(container: HTMLElement, context: RuleListContext, onEdit: (index: number) => void, onDelete: (index: number) => void, onReorder: (fromIndex: number, toIndex: number) => void): void;
/**
 * Add a new routing rule to the meta-agent
 *
 * @param config - The current Olimpus config
 * @param metaAgentName - The meta-agent name to add rule to
 * @returns Updated config with new rule
 * @throws Error if meta-agent does not exist
 */
export declare function addRule(config: OlimpusConfig, metaAgentName: string): OlimpusConfig;
/**
 * Delete a routing rule from the meta-agent
 *
 * @param config - The current Olimpus config
 * @param metaAgentName - The meta-agent name to delete rule from
 * @param ruleIndex - The index of the rule to delete
 * @returns Updated config without the deleted rule
 * @throws Error if meta-agent or rule does not exist
 */
export declare function deleteRule(config: OlimpusConfig, metaAgentName: string, ruleIndex: number): OlimpusConfig;
/**
 * Reorder routing rules
 *
 * @param config - The current Olimpus config
 * @param metaAgentName - The meta-agent name
 * @param fromIndex - The index to move from
 * @param toIndex - The index to move to
 * @returns Updated config with reordered rules
 * @throws Error if meta-agent or indexes are invalid
 */
export declare function reorderRule(config: OlimpusConfig, metaAgentName: string, fromIndex: number, toIndex: number): OlimpusConfig;
/**
 * Initialize the routing rule list with event handlers
 *
 * @param config - The current Olimpus config
 * @param selectedMetaAgent - Currently selected meta-agent name
 * @param onConfigChange - Callback when configuration changes
 * @param onEditRule - Callback when a rule is edited
 * @returns Object with cleanup and selection methods
 */
export declare function initializeRuleList(config: OlimpusConfig, selectedMetaAgent: string | null, onConfigChange: (newConfig: OlimpusConfig) => void, onEditRule?: (metaAgentName: string, ruleIndex: number) => void): {
    update: (newConfig: OlimpusConfig) => void;
    setMetaAgent: (name: string | null) => void;
    destroy: () => void;
};
export {};
//# sourceMappingURL=rule-list.d.ts.map