import type { AgentConfig } from "@opencode-ai/sdk";
import type { MetaAgentDef } from "../config/schema.js";

/**
 * Creates a full AgentConfig for a meta-agent from its definition.
 * Maps all MetaAgentDef fields to AgentConfig properties.
 */
export function createMetaAgentConfig(
  def: MetaAgentDef,
  metaAgentName: string,
): AgentConfig {
  const agentConfig: AgentConfig = {
    model: def.base_model,
    ...(def.prompt_template && { prompt: def.prompt_template }),
    ...(def.temperature !== undefined && { temperature: def.temperature }),
    ...(def.description && { description: def.description }),
    ...(def.mode && { mode: def.mode }),
    ...(def.color && { color: def.color }),
    ...(def.maxTokens !== undefined && { maxTokens: def.maxTokens }),
    ...(def.hidden !== undefined && { hidden: def.hidden }),
    ...(def.thinking && { thinking: def.thinking }),
    ...(def.reasoningEffort && { reasoningEffort: def.reasoningEffort }),
    ...(def.permission && { permission: def.permission }),
  };

  return agentConfig;
}
