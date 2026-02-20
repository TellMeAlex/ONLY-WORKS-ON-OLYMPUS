import type {
  OlimpusConfig,
  MetaAgentDef,
  RoutingRule,
  AgentOverride,
  CategoryConfig,
} from "$lib/types";

export const DEFAULT_CONFIG: OlimpusConfig = {
  meta_agents: {
    atenea: {
      base_model: "",
      delegates_to: [
        "librarian",
        "explore",
        "oracle",
        "sisyphus",
        "hephaestus",
        "prometheus",
        "atlas",
        "metis",
      ],
      routing_rules: [
        {
          matcher: { type: "complexity", threshold: "high" },
          target_agent: "oracle",
        },
        {
          matcher: { type: "complexity", threshold: "medium" },
          target_agent: "prometheus",
        },
        { matcher: { type: "always" }, target_agent: "metis" },
      ],
    },
    hermes: {
      base_model: "",
      delegates_to: ["librarian", "explore", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "keyword",
            keywords: ["docs", "documentation", "guide", "search"],
            mode: "any",
          },
          target_agent: "librarian",
        },
        { matcher: { type: "always" }, target_agent: "explore" },
      ],
    },
  },
  settings: { namespace_prefix: "olimpus", max_delegation_depth: 3 },
};

let config = $state<OlimpusConfig>(structuredClone(DEFAULT_CONFIG));
let savedSnapshot = $state<string>(JSON.stringify(DEFAULT_CONFIG));

export function isDirty(): boolean {
  return JSON.stringify($state.snapshot(config)) !== savedSnapshot;
}

export function configSnapshot(): OlimpusConfig {
  return $state.snapshot(config) as OlimpusConfig;
}

export function metaAgentNames(): string[] {
  return Object.keys(config.meta_agents ?? {}).sort();
}

export function metaAgentEntries(): [string, MetaAgentDef][] {
  return Object.entries(config.meta_agents ?? {});
}

export function loadConfig(newConfig: OlimpusConfig): void {
  config.meta_agents = newConfig.meta_agents;
  config.providers = newConfig.providers;
  config.settings = newConfig.settings;
  config.skills = newConfig.skills;
  config.agents = newConfig.agents;
  config.categories = newConfig.categories;
  config.disabled_hooks = newConfig.disabled_hooks;
  savedSnapshot = JSON.stringify(newConfig);
}

export function resetConfig(): void {
  loadConfig(structuredClone(DEFAULT_CONFIG));
}

export function markClean(): void {
  savedSnapshot = JSON.stringify($state.snapshot(config));
}

export function addMetaAgent(name: string, def: MetaAgentDef): void {
  if (!config.meta_agents) config.meta_agents = {};
  config.meta_agents[name] = def;
}

export function updateMetaAgent(name: string, def: MetaAgentDef): void {
  if (config.meta_agents) config.meta_agents[name] = def;
}

export function deleteMetaAgent(name: string): void {
  if (config.meta_agents) delete config.meta_agents[name];
}

export function renameMetaAgent(oldName: string, newName: string): void {
  if (!config.meta_agents || !config.meta_agents[oldName]) return;
  const def = config.meta_agents[oldName];
  delete config.meta_agents[oldName];
  config.meta_agents[newName] = def;
}

export function addRule(agentName: string, rule: RoutingRule): void {
  if (!config.meta_agents?.[agentName]) return;
  config.meta_agents[agentName].routing_rules.push(rule);
}

export function updateRule(
  agentName: string,
  index: number,
  rule: RoutingRule,
): void {
  if (!config.meta_agents?.[agentName]) return;
  config.meta_agents[agentName].routing_rules[index] = rule;
}

export function deleteRule(agentName: string, index: number): void {
  if (!config.meta_agents?.[agentName]) return;
  config.meta_agents[agentName].routing_rules.splice(index, 1);
}

export function reorderRules(
  agentName: string,
  fromIndex: number,
  toIndex: number,
): void {
  if (!config.meta_agents?.[agentName]) return;
  const rules = config.meta_agents[agentName].routing_rules;
  const [moved] = rules.splice(fromIndex, 1);
  rules.splice(toIndex, 0, moved);
}

export function updateProviders(providers: OlimpusConfig["providers"]): void {
  config.providers = providers;
}

export function updateSettings(settings: OlimpusConfig["settings"]): void {
  config.settings = settings;
}

export function addAgent(name: string, def: AgentOverride): void {
  if (!config.agents) config.agents = {};
  config.agents[name] = def;
}

export function updateAgent(name: string, def: AgentOverride): void {
  if (config.agents) config.agents[name] = def;
}

export function deleteAgent(name: string): void {
  if (config.agents) delete config.agents[name];
}

export function addCategory(name: string, def: CategoryConfig): void {
  if (!config.categories) config.categories = {};
  config.categories[name] = def;
}

export function updateCategory(name: string, def: CategoryConfig): void {
  if (config.categories) config.categories[name] = def;
}

export function deleteCategory(name: string): void {
  if (config.categories) delete config.categories[name];
}

export function addSkill(skill: string): void {
  if (!config.skills) config.skills = [];
  if (!config.skills.includes(skill)) config.skills.push(skill);
}

export function removeSkill(skill: string): void {
  if (config.skills) config.skills = config.skills.filter((s) => s !== skill);
}

export function addDisabledHook(hook: string): void {
  if (!config.disabled_hooks) config.disabled_hooks = [];
  if (!config.disabled_hooks.includes(hook)) config.disabled_hooks.push(hook);
}

export function removeDisabledHook(hook: string): void {
  if (config.disabled_hooks)
    config.disabled_hooks = config.disabled_hooks.filter((h) => h !== hook);
}
