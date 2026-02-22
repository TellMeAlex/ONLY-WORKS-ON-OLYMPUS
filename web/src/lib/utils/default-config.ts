import type { OlimpusConfig } from "$lib/types";

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
