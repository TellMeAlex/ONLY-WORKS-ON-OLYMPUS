import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Config } from "@opencode-ai/sdk";
import { loadOlimpusConfig } from "./config/loader.js";
import { extractMetaAgentDefs } from "./config/translator.js";
import {
  createOlimpusWrapper,
  type PluginInterface,
} from "./plugin/wrapper.js";
import { MetaAgentRegistry } from "./agents/registry.js";
import { ateneo, hermes, hefesto } from "./agents/definitions/index.js";
import { loadOlimpusSkills } from "./skills/loader.js";

/**
 * OlimpusPlugin - Meta-orchestrator plugin for OpenCode
 *
 * Execution flow:
 * 1. Load olimpus.jsonc from project directory
 * 2. Create MetaAgentRegistry and register all meta-agents (built-in + config)
 * 3. Call createOlimpusWrapper() to get merged PluginInterface
 * 4. Enhance config handler to register meta-agent AgentConfigs
 * 5. Load and merge Olimpus skills if configured
 * 6. Return final PluginInterface
 *
 * Error handling:
 * - If olimpus.jsonc not found: logs warning, falls through to oh-my-opencode defaults
 * - If oh-my-opencode fails: throws with helpful message
 */
const OlimpusPlugin: Plugin = async (input: PluginInput) => {
  let config;

  try {
    config = loadOlimpusConfig(input.directory);
  } catch (error) {
    throw new Error(
      `[Olimpus] Failed to load olimpus.jsonc: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const maxDepth = config.settings?.max_delegation_depth ?? 3;
  const registry = new MetaAgentRegistry(maxDepth);

  const configMetaAgents = extractMetaAgentDefs(config);
  for (const [name, def] of Object.entries(configMetaAgents)) {
    registry.register(name, def);
  }

  const builtInMetaAgents = [
    { name: "olimpus:atenea", def: ateneo },
    { name: "olimpus:hermes", def: hermes },
    { name: "olimpus:hefesto", def: hefesto },
  ];

  for (const { name, def } of builtInMetaAgents) {
    if (!configMetaAgents[name]) {
      registry.register(name, def);
    }
  }

  let pluginInterface: PluginInterface;
  try {
    pluginInterface = await createOlimpusWrapper(input, config);
  } catch (error) {
    throw new Error(
      `[Olimpus] Failed to initialize oh-my-opencode wrapper: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const baseConfigHandler = pluginInterface.config;
  const namespace = config.settings?.namespace_prefix ?? "olimpus";

  pluginInterface.config = async (configInput: Config) => {
    if (baseConfigHandler) {
      await baseConfigHandler(configInput);
    }

    const routingContext = {
      prompt: "",
      projectDir: input.directory,
      projectFiles: [],
      projectDeps: [],
    };

    const allMetaAgents = registry.getAll();
    for (const [agentName] of Object.entries(allMetaAgents)) {
      const agentConfig = registry.resolve(agentName, routingContext);
      if (agentConfig && configInput.agent) {
        configInput.agent[agentName] = agentConfig;
      }
    }
  };

  if (config.skills && config.skills.length > 0) {
    try {
      const olimpusSkills = loadOlimpusSkills(config.skills, input.directory);
      if (olimpusSkills.length > 0) {
        console.log(
          `[Olimpus] Loaded ${olimpusSkills.length} Olimpus skills with ${namespace}: prefix`,
        );
      }
    } catch (error) {
      console.warn(
        `[Olimpus] Failed to load skills: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return pluginInterface;
};

export default OlimpusPlugin;
