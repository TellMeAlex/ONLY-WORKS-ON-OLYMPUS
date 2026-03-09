import type {
  OlimpusConfig,
  MetaAgentDef,
  AgentOverride,
  CategoryConfig,
} from "./schema";

const BUILTIN_ALIAS_TO_CANONICAL: Record<string, string> = {
  atenea: "atenea",
  ateneo: "atenea",
  hermes: "hermes",
  hades: "hades",
  hefesto: "hades",
};

function canonicalizeMetaAgentName(name: string, namespace: string): string {
  if (name.startsWith(`${namespace}:`)) {
    return name;
  }

  const normalized = BUILTIN_ALIAS_TO_CANONICAL[name];
  if (normalized) {
    return `${namespace}:${normalized}`;
  }

  return name;
}

function normalizeMetaAgentDef(
  def: MetaAgentDef,
  namespace: string,
): MetaAgentDef {
  const delegates = def.delegates_to.map((target) =>
    canonicalizeMetaAgentName(target, namespace),
  );

  const rules = def.routing_rules.map((rule) => ({
    ...rule,
    target_agent: canonicalizeMetaAgentName(rule.target_agent, namespace),
  }));

  return {
    ...def,
    delegates_to: delegates,
    routing_rules: rules,
  };
}

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
  namespace: string = config.settings?.namespace_prefix ?? "olimpus",
): Record<string, MetaAgentDef> {
  const metaAgents = config.meta_agents ?? {};
  const normalized: Record<string, MetaAgentDef> = {};

  for (const [name, def] of Object.entries(metaAgents)) {
    const canonicalName = canonicalizeMetaAgentName(name, namespace);
    normalized[canonicalName] = normalizeMetaAgentDef(def, namespace);
  }

  return normalized;
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
