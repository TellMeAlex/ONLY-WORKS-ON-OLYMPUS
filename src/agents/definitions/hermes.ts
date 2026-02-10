import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Hermes - Communication & Research Meta-Agent
 * Handles information gathering, documentation research, and synthesis
 * Routes based on keywords: docs/search → librarian, code/find → explore, analyze/review → oracle
 * Always falls back to librarian for general research
 */
export const hermes: MetaAgentDef = {
  base_model: "",
  delegates_to: ["librarian", "explore", "oracle"],
  routing_rules: [
    {
      matcher: {
        type: "keyword",
        keywords: ["docs", "documentation", "guide", "search", "lookup"],
        mode: "any",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "You are a research specialist focused on finding and synthesizing documentation. Search comprehensively for relevant documentation, guides, and examples.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["code", "find", "search", "locate", "where is"],
        mode: "any",
      },
      target_agent: "explore",
      config_overrides: {
        prompt:
          "You are a code explorer. Search the codebase comprehensively to find relevant code, patterns, and implementations.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["analyze", "review", "compare", "evaluate", "assess"],
        mode: "any",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "You are a comprehensive analyst. Review and analyze the gathered information, providing deep insights and comparisons.",
      },
    },
    {
      matcher: {
        type: "always",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "You are a research specialist. Gather relevant information from available sources and synthesize it into a coherent answer.",
      },
    },
  ],
  prompt_template:
    "Research and gather information on: {input}\n\nProvide:\n- Relevant documentation and resources\n- Current best practices\n- Practical examples\n- Synthesis of findings",
};
