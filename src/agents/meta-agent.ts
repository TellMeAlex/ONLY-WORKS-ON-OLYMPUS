import type { MetaAgentDef } from "../config/schema.js";
import { evaluateRoutingRules, type RoutingContext, type ResolvedRoute } from "./routing.js";
import type { RoutingLogger } from "./logger.js";

type AgentConfig = {
  model?: string;
  prompt?: string;
  temperature?: number;
  variant?: string;
};

/**
 * Creates an AgentConfig for a meta-agent by evaluating its routing rules
 * against the provided context
 *
 * @param def - Meta-agent definition with routing rules
 * @param context - Routing context (prompt, projectDir, etc.)
 * @param metaAgentName - Name of the meta-agent
 * @param logger - Optional routing logger for logging routing decisions
 * @returns AgentConfig with delegation instructions, or null if no route matched
 */
export function createMetaAgentConfig(
  def: MetaAgentDef,
  context: RoutingContext,
  metaAgentName: string,
  logger?: RoutingLogger
): AgentConfig | null {
  // Evaluate routing rules to find target agent
  const route = evaluateRoutingRules(def.routing_rules, context, logger) as unknown as ResolvedRoute | null;

  if (!route) {
    // No route matched - caller should handle this
    return null;
  }

  // Build delegation prompt that instructs meta-agent to delegate to target
  const delegationPrompt = buildDelegationPrompt(
    metaAgentName,
    route.target_agent,
    context.prompt
  );

  // Determine final model (rule override or default)
  const model = route.config_overrides?.model || def.base_model;

  // Determine temperature (rule override or default)
  const temperature = route.config_overrides?.temperature || def.temperature;

  // Build AgentConfig
  const agentConfig: AgentConfig = {
    model,
    prompt: delegationPrompt,
    ...(temperature !== undefined && { temperature }),
    ...(route.config_overrides?.variant && {
      variant: route.config_overrides.variant,
    }),
  };

  return agentConfig;
}

/**
 * Builds a system prompt for a meta-agent that delegates work to another agent
 * using the `task` tool
 *
 * @param metaAgentName - Name of the meta-agent
 * @param targetAgent - Name of the agent to delegate to
 * @param originalPrompt - The user's original request
 * @returns System prompt with delegation instructions
 */
export function buildDelegationPrompt(
  metaAgentName: string,
  targetAgent: string,
  originalPrompt: string
): string {
  return `You are ${metaAgentName}, a meta-agent coordinator for the Olimpus plugin system.

Your role is to analyze the user's request and delegate it to the appropriate specialized agent.

Based on the user's request, you have determined that this task should be handled by the "${targetAgent}" agent.

**User Request:**
${originalPrompt}

**Your Task:**
1. Understand the user's request above
2. Use the \`task\` tool to delegate this work to the "${targetAgent}" agent
3. Include the full user request in the task delegation
4. Return the result from the ${targetAgent} agent to the user

The task tool accepts:
- agent: "${targetAgent}"
- prompt: The user's request (pass it through as-is)

Delegate this task now using the available task tool.`;
}
