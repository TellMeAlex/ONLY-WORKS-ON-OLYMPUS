import { describe, expect, test } from "bun:test";
import { extractMetaAgentDefs } from "./translator.js";
import type { OlimpusConfig } from "./schema.js";

describe("extractMetaAgentDefs", () => {
  test("returns meta agents without alias normalization", () => {
    const config: OlimpusConfig = {
      meta_agents: {
        "olimpus:atenea": {
          base_model: "",
          delegates_to: ["olimpus:hermes", "oracle"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "olimpus:hades",
            },
          ],
        },
      },
    };

    const defs = extractMetaAgentDefs(config);

    expect(defs["olimpus:atenea"]).toBeDefined();
    expect(defs.atenea).toBeUndefined();
    expect(defs["olimpus:atenea"]?.delegates_to).toContain("olimpus:hermes");
    expect(defs["olimpus:atenea"]?.routing_rules[0]?.target_agent).toBe(
      "olimpus:hades",
    );
  });

  test("keeps custom meta-agent IDs unchanged", () => {
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
  });

  test("drops legacy unscoped Olimpus built-in IDs", () => {
    const config: OlimpusConfig = {
      meta_agents: {
        atenea: {
          base_model: "",
          delegates_to: ["oracle"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "oracle" },
          ],
        },
        hades: {
          base_model: "",
          delegates_to: ["sisyphus"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "sisyphus" },
          ],
        },
        "olimpus:hades": {
          base_model: "",
          delegates_to: ["sisyphus"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "sisyphus" },
          ],
        },
      },
    };

    const defs = extractMetaAgentDefs(config);

    expect(defs.atenea).toBeUndefined();
    expect(defs.hades).toBeUndefined();
    expect(defs["olimpus:hades"]).toBeDefined();
  });
});
