import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Hades - Framework Validation Meta-Agent
 * Ensures modifications to the Olympus framework maintain coherence with existing features
 * Routes based on framework file patterns: config/schema → oracle, agents/definitions → sisyphus, plugin → hephaestus
 * Always falls back to hephaestus for building
 */
export const hades: MetaAgentDef = {
  base_model: "",
  delegates_to: ["oracle", "sisyphus", "hephaestus"],
  routing_rules: [
    {
      matcher: {
        type: "regex",
        pattern: "src/config/.*\\.ts",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "You are a framework validation specialist. Analyze this configuration change carefully, considering impacts on: existing schemas, agent definitions, routing rules, and plugin behavior. Ensure backward compatibility and validate that changes don't break existing workflows.",
        variant: "validation",
      },
    },
    {
      matcher: {
        type: "regex",
        pattern: "src/agents/.*\\.ts",
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "You are a framework agent specialist. Modify agent definitions with care, ensuring routing rules remain valid, delegation targets exist, and matcher logic is correct. Test changes thoroughly and verify no circular delegation is introduced.",
        variant: "validation",
      },
    },
    {
      matcher: {
        type: "regex",
        pattern: "src/plugin/.*\\.ts",
      },
      target_agent: "hephaestus",
      config_overrides: {
        prompt:
          "You are a plugin infrastructure specialist. Implement plugin changes with attention to: lifecycle hooks, error handling, registration patterns, and integration points. Ensure changes maintain plugin compatibility.",
        variant: "validation",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "config",
          "schema",
          "agent",
          "routing",
          "definition",
          "plugin",
          "framework",
          "validation",
          "registry",
        ],
        mode: "any",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "You are a framework coherence analyst. Analyze this framework-related change considering: impacts on existing features, workflow disruptions, agent delegation chains, and configuration consistency. Provide recommendations for safe implementation.",
      },
    },
    {
      matcher: {
        type: "always",
      },
      target_agent: "hephaestus",
      config_overrides: {
        prompt:
          "You are a framework builder. Implement this change with careful attention to maintaining framework stability, backward compatibility, and proper integration with existing systems.",
      },
    },
  ],
  prompt_template:
    "Validate and implement this framework modification: {input}\n\nConsider:\n- Impact on existing features and workflows\n- Backward compatibility\n- Agent delegation chains\n- Configuration consistency\n- Error handling and edge cases",
};
