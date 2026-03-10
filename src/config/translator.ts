import type {
  OlimpusConfig,
  MetaAgentDef,
  AgentOverride,
  CategoryConfig,
} from "./schema";

const LEGACY_OLIMPUS_AGENT_IDS = new Set([
  "atenea",
  "ateneo",
  "hermes",
  "hades",
  "hefesto",
]);

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
  config: OlimpusConfig,
): Record<string, MetaAgentDef> {
  const defs = config.meta_agents ?? {};
  const filtered: Record<string, MetaAgentDef> = {};

  for (const [name, def] of Object.entries(defs)) {
    if (LEGACY_OLIMPUS_AGENT_IDS.has(name)) {
      continue;
    }
    filtered[name] = def;
  }

  return filtered;
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
