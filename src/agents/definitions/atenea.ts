import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Atenea - Strategic Planning Meta-Agent
 * Handles high-level architecture, design, and strategic analysis
 * Routes based on complexity: high complexity → oracle, medium → prometheus, low → atlas
 * Always falls back to metis for general analysis
 */
export const ateneo: MetaAgentDef = {
  base_model: "", // Uses default from config
  delegates_to: ["prometheus", "oracle", "atlas", "metis"],
  routing_rules: [
    {
      matcher: {
        type: "complexity",
        threshold: "high",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "You are a strategic architecture advisor. Analyze this complex problem from first principles, considering system design patterns, scalability, maintainability, and long-term implications.",
      },
    },
    {
      matcher: {
        type: "complexity",
        threshold: "medium",
      },
      target_agent: "prometheus",
      config_overrides: {
        prompt:
          "You are a technical strategist. Analyze this problem considering trade-offs, patterns, and best practices. Focus on pragmatic solutions aligned with industry standards.",
      },
    },
    {
      matcher: {
        type: "complexity",
        threshold: "low",
      },
      target_agent: "atlas",
      config_overrides: {
        prompt:
          "You are a technical advisor. Provide clear analysis and guidance on this straightforward technical question.",
      },
    },
    {
      matcher: {
        type: "always",
      },
      target_agent: "metis",
      config_overrides: {
        prompt:
          "You are a general technical analyst. Synthesize information and provide comprehensive strategic analysis.",
      },
    },
  ],
  prompt_template:
    "Analyze this strategic and architectural question: {input}\n\nProvide analysis considering:\n- System design principles\n- Scalability and performance\n- Maintainability and technical debt\n- Trade-offs and alternatives",
};
