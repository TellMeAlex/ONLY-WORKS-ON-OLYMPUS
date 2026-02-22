/**
 * Other Configurations Component
 *
 * Handles the UI for agents, categories, and skills configuration.
 * These are passthrough sections for oh-my-opencode integration.
 */
import type { AgentOverride, CategoryConfig } from "./types";
/**
 * Initialize agents configuration
 *
 * @param agents - Current agents configuration
 * @param onChange - Callback when configuration changes
 * @returns Object with update/destroy/getValue methods
 */
export declare function initializeAgents(agents: Record<string, AgentOverride>, onChange: (agents: Record<string, AgentOverride>) => void): {
    update: (agents: Record<string, AgentOverride>) => void;
    destroy: () => void;
    getValue: () => Record<string, AgentOverride>;
};
/**
 * Initialize categories configuration
 *
 * @param categories - Current categories configuration
 * @param onChange - Callback when configuration changes
 * @returns Object with update/destroy/getValue methods
 */
export declare function initializeCategories(categories: Record<string, CategoryConfig>, onChange: (categories: Record<string, CategoryConfig>) => void): {
    update: (categories: Record<string, CategoryConfig>) => void;
    destroy: () => void;
    getValue: () => Record<string, CategoryConfig>;
};
/**
 * Initialize skills configuration
 *
 * @param skills - Current skills array
 * @param onChange - Callback when configuration changes
 * @returns Object with update/destroy/getValue methods
 */
export declare function initializeSkills(skills: string[], onChange: (skills: string[]) => void): {
    update: (skills: string[]) => void;
    destroy: () => void;
    getValue: () => string[];
};
//# sourceMappingURL=other-configs.d.ts.map