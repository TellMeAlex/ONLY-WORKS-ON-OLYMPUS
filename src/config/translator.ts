import type {
  OlimpusConfig,
  MetaAgentDef,
  AgentOverride,
  CategoryConfig,
} from "./schema";

/**
 * Translate OlimpusConfig to oh-my-opencode compatible config format.
 * Extracts only oh-my-opencode passthrough fields (agents, categories, disabled_hooks).
 * Strips olimpus-specific fields (meta_agents, settings, skills).
 * Output is compatible with oh-my-opencode's PluginConfigSchema shape.
 */
export function translateToOMOConfig(config: OlimpusConfig): OMOPluginConfig {
  return {
    agents: config.agents ?? {},
    categories: config.categories ?? {},
    disabled_hooks: config.disabled_hooks ?? [],
  };
}

/**
 * Extract Olimpus-specific meta-agent definitions from config.
 * Returns only the meta_agents section (olimpus-specific extension).
 */
export function extractMetaAgentDefs(
  config: OlimpusConfig
): Record<string, MetaAgentDef> {
  return config.meta_agents ?? {};
}

/**
 * OMOPluginConfig represents the oh-my-opencode compatible config shape.
 * This is a subset of OhMyOpenCodeConfig containing only the fields
 * that plugins can set via JSONC config.
 */
export interface OMOPluginConfig {
  agents?: Record<string, AgentOverride>;
  categories?: Record<string, CategoryConfig>;
  disabled_hooks?: string[];
}
