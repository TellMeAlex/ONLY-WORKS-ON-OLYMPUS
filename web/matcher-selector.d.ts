/**
 * Matcher Type Selector Component
 *
 * Provides a UI for selecting between the 5 matcher types:
 * - keyword: Match based on keywords with any/all mode
 * - complexity: Match based on task complexity threshold
 * - regex: Match based on regular expression pattern
 * - project_context: Match based on project files/dependencies
 * - always: Always match (fallback rule)
 */
import type { Matcher } from "./types";
/**
 * Available matcher types with their display labels and descriptions
 */
export interface MatcherTypeOption {
    value: Matcher["type"];
    label: string;
    description: string;
}
/**
 * All available matcher type options
 */
export declare const MATCHER_TYPES: MatcherTypeOption[];
/**
 * Get the default matcher object for a given type
 *
 * @param type - The matcher type
 * @returns A default matcher object for the type
 */
export declare function getDefaultMatcher(type: Matcher["type"]): Matcher;
/**
 * Create a matcher type selector as a radio button group
 *
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @returns The selector DOM element
 */
export declare function createMatcherSelector(selectedType: Matcher["type"], onChange: (type: Matcher["type"]) => void): HTMLElement;
/**
 * Create a matcher type selector as a dropdown (select element)
 *
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @param id - Optional ID for the select element
 * @returns The select element wrapped in a container
 */
export declare function createMatcherSelectorDropdown(selectedType: Matcher["type"], onChange: (type: Matcher["type"]) => void, id?: string): HTMLElement;
/**
 * Validate a matcher type value
 *
 * @param value - The value to validate
 * @returns True if the value is a valid matcher type
 */
export declare function isValidMatcherType(value: string): value is Matcher["type"];
/**
 * Get matcher type option by value
 *
 * @param value - The matcher type value
 * @returns The matcher type option or undefined if not found
 */
export declare function getMatcherTypeOption(value: Matcher["type"]): MatcherTypeOption | undefined;
/**
 * Render a matcher selector into a container
 *
 * @param container - The container element to render into
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @param useDropdown - Whether to use dropdown (true) or radio buttons (false)
 */
export declare function renderMatcherSelector(container: HTMLElement, selectedType: Matcher["type"], onChange: (type: Matcher["type"]) => void, useDropdown?: boolean): void;
/**
 * Initialize a matcher selector with event handling
 *
 * @param containerId - The ID of the container element
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @param useDropdown - Whether to use dropdown (true) or radio buttons (false)
 * @returns Object with update and destroy methods
 */
export declare function initializeMatcherSelector(containerId: string, selectedType: Matcher["type"], onChange: (type: Matcher["type"]) => void, useDropdown?: boolean): {
    update: (type: Matcher["type"]) => void;
    destroy: () => void;
};
//# sourceMappingURL=matcher-selector.d.ts.map