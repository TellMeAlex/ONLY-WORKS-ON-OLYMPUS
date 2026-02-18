import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Atenea - Primary Orchestrator Meta-Agent
 * Central coordinator routing requests to internal Olympus agents (via their routing patterns)
 * and Oh my OpenCode builtin agents. Routes based on: Jira keywords → research agents,
 * framework patterns → validation agents, complexity → strategic agents.
 * Always falls back to metis for general analysis
 */
export const ateneo: MetaAgentDef = {
  base_model: "", // Uses default from config
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
    // Jira-related routing (coordinated with Hermes patterns)
    {
      matcher: {
        type: "keyword",
        keywords: ["jira", "ticket", "task", "subtask", "story", "issue", "sprint", "backlog"],
        mode: "any",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "You are a Jira lifecycle research specialist. Search for relevant documentation, existing tickets, related issues, and project context to support this Jira-related request. Consider ticket states, workflow transitions, and integration requirements.",
      },
    },
    // Framework modification routing (coordinated with Hades patterns)
    {
      matcher: {
        type: "project_context",
        has_files: ["src/config/", "src/agents/", "src/plugin/"],
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "You are a framework validation strategist. Analyze this framework modification considering: impact on existing features, workflow disruptions, agent delegation chains, and configuration consistency. Recommend safe implementation approaches.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "framework",
          "validation",
          "config",
          "schema",
          "agent definition",
          "routing rule",
          "registry",
        ],
        mode: "any",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "You are a framework coherence analyst. Evaluate this framework-related request for: backward compatibility, impact on existing agents, routing integrity, and configuration stability.",
      },
    },
    // Complexity-based strategic routing
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
    // Always fallback for general analysis
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
