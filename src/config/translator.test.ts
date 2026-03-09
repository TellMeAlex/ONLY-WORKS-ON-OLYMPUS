import { describe, expect, test } from "bun:test";
import { extractMetaAgentDefs } from "./translator.js";
import type { OlimpusConfig } from "./schema.js";

describe("extractMetaAgentDefs", () => {
  test("normalizes Olimpus built-in aliases to namespaced canonical names", () => {
    const config: OlimpusConfig = {
      meta_agents: {
        atenea: {
          base_model: "",
          delegates_to: ["hermes", "oracle"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "hades",
            },
          ],
        },
      },
      settings: {
        namespace_prefix: "olimpus",
        max_delegation_depth: 3,
      },
    };

    const defs = extractMetaAgentDefs(config);

    expect(defs["olimpus:atenea"]).toBeDefined();
    expect(defs.atenea).toBeUndefined();

    const atenea = defs["olimpus:atenea"];
    expect(atenea?.delegates_to).toContain("olimpus:hermes");
    expect(atenea?.delegates_to).toContain("oracle");
    expect(atenea?.routing_rules[0]?.target_agent).toBe("olimpus:hades");
  });

  test("keeps non-builtin custom meta-agents unmodified", () => {
    const config: OlimpusConfig = {
      meta_agents: {
        reviewer: {
          base_model: "",
          delegates_to: ["oracle"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "oracle",
            },
          ],
        },
      },
    };

    const defs = extractMetaAgentDefs(config);

    expect(defs.reviewer).toBeDefined();
    expect(defs["olimpus:reviewer"]).toBeUndefined();
    expect(defs.reviewer?.routing_rules[0]?.target_agent).toBe("oracle");
  });
});
