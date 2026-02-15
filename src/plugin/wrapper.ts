import type { PluginInput, Hooks } from "@opencode-ai/plugin";
import type { Config } from "@opencode-ai/sdk";
import OhMyOpenCodePlugin from "oh-my-opencode";
import {
  translateToOMOConfig,
  extractMetaAgentDefs,
  type OMOPluginConfig,
} from "../config/translator";
import type { OlimpusConfig, MetaAgentDef } from "../config/schema";

/**
 * PluginInterface is an alias for the Hooks type returned by plugins.
 * It defines the contract between plugins and the oh-my-opencode framework.
 */
export type PluginInterface = Hooks;

/**
 * Create the Olimpus plugin wrapper.
 *
 * This function:
 * 1. Translates OlimpusConfig to OMO-compatible config using translateToOMOConfig()
 * 2. Calls the oh-my-opencode plugin with the input
 * 3. Extracts Olimpus meta-agent definitions
 * 4. Creates Olimpus extension handlers (stub for now, will be populated by Task 6)
 * 5. Merges the base PluginInterface with Olimpus extensions
 * 6. Returns the combined PluginInterface
 *
 * @param input - PluginInput containing client, project, directory, etc.
 * @param config - OlimpusConfig for routing rules and meta-agents
 * @returns Combined PluginInterface with OMO handlers + Olimpus extensions
 */
export async function createOlimpusWrapper(
  input: PluginInput,
  config: OlimpusConfig,
): Promise<PluginInterface> {
  // Step 1: Translate to OMO config (extracts agents, categories, disabled_hooks)
  const omoConfig = translateToOMOConfig(config);

  // Step 2: Call oh-my-opencode plugin to get base handlers
  const omoPluginInterface = await OhMyOpenCodePlugin(input);

  // Step 3: Extract Olimpus meta-agent definitions
  const metaAgents = extractMetaAgentDefs(config);

  // Step 4: Create Olimpus extension handlers (stub for now)
  // Will be populated by Task 6 with factory that converts meta-agents to agent configs
  const olimpusExtension = createOlimpusExtension(metaAgents, omoConfig);

  // Step 5: Merge base PluginInterface with Olimpus extensions
  const mergedInterface = mergePluginInterfaces(
    omoPluginInterface,
    olimpusExtension,
  );

  // Step 6: Return combined PluginInterface
  return mergedInterface;
}

/**
 * Create stub Olimpus extension handlers.
 * This is a placeholder that will be populated with meta-agent factories in Task 6.
 *
 * For now, it returns a minimal extension with a config handler that:
 * - Preserves the OMO config
 * - Prepares for future meta-agent agent-config generation
 *
 * @param metaAgents - Extracted meta-agent definitions
 * @param omoConfig - Translated OMO config
 * @returns Stub PluginInterface for Olimpus extensions
 */
function createOlimpusExtension(
  metaAgents: Record<string, MetaAgentDef>,
  omoConfig: OMOPluginConfig,
): PluginInterface {
  return {
    config: async (input: Config) => {
      // Stub config handler for future meta-agent setup
      // Task 6 will implement factory that converts meta-agents to agent configs
      // and calls this handler with the generated config
    },
  };
}

/**
 * Merge two PluginInterfaces into one combined interface.
 *
 * Merge strategy:
 * - Tool handlers: Spread base handlers, then extension handlers (extension overwrites)
 * - Config handler: Chain both (base first, then extension)
 * - Hooks: Chain all handlers (base first, then extension)
 * - Other properties: Extension overwrites base
 *
 * @param base - Base PluginInterface (from oh-my-opencode)
 * @param extension - Extension PluginInterface (from Olimpus)
 * @returns Merged PluginInterface
 */
export function mergePluginInterfaces(
  base: PluginInterface,
  extension: PluginInterface,
): PluginInterface {
  const merged: PluginInterface = {};

  // Merge tool handlers (spread both, extension overwrites)
  if (base.tool || extension.tool) {
    merged.tool = {
      ...base.tool,
      ...extension.tool,
    };
  }

  // Chain config handlers (base first, then extension)
  if (base.config || extension.config) {
    merged.config = async (input: Config) => {
      // Execute base config handler
      if (base.config) {
        await base.config(input);
      }
      // Execute extension config handler
      if (extension.config) {
        await extension.config(input);
      }
    };
  }

  // Chain event handlers (base first, then extension)
  if (base.event || extension.event) {
    merged.event = async (
      input: Parameters<NonNullable<typeof base.event>>[0],
    ) => {
      if (base.event) {
        await base.event(input);
      }
      if (extension.event) {
        await extension.event(input);
      }
    };
  }

  // Chain all other hooks (base first, then extension)
  // These include: chat.message, chat.params, chat.headers, permission.ask, etc.
  type HookName = keyof PluginInterface;
  const hookNames: HookName[] = [
    "chat.message",
    "chat.params",
    "chat.headers",
    "permission.ask",
    "command.execute.before",
    "tool.execute.before",
    "shell.env",
    "tool.execute.after",
    "experimental.chat.messages.transform",
    "experimental.chat.system.transform",
    "experimental.session.compacting",
    "experimental.text.complete",
  ];

  for (const hookName of hookNames) {
    const baseHook = base[hookName];
    const extensionHook = extension[hookName];

    if (baseHook || extensionHook) {
      (merged[hookName] as any) = async (...args: any[]) => {
        if (baseHook) {
          await (baseHook as any)(...args);
        }
        if (extensionHook) {
          await (extensionHook as any)(...args);
        }
      };
    }
  }

  // Copy auth hook (extension overwrites)
  if (base.auth || extension.auth) {
    merged.auth = extension.auth ?? base.auth;
  }

  return merged;
}
