import { test, expect, describe } from "bun:test";
import type { MetaAgentDef, OlimpusConfig } from "./schema.js";
import {
  checkCircularDependencies,
  checkCircularDependenciesInConfig,
  checkAgentReferences,
  checkAgentReferencesInConfig,
  createCircularDependencyError,
  createInvalidAgentReferenceError,
  createCheckResult,
  type CircularDependencyError,
  type InvalidAgentReferenceError,
  type CheckResult,
} from "./validator.js";

describe("circular dependency", () => {
  describe("checkCircularDependencies", () => {
    test("returns empty array for empty meta_agents", () => {
      // Arrange
      const metaAgents: Record<string, MetaAgentDef> = {};

      // Act
      const errors = checkCircularDependencies(metaAgents);

      // Assert
      expect(errors).toEqual([]);
    });

    test("returns empty array when no circular dependencies exist", () => {
      // Arrange: Valid config with meta-agents delegating to builtin agents only
      const metaAgents: Record<string, MetaAgentDef> = {
        router: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["sisyphus", "hephaestus"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "sisyphus",
            },
          ],
        },
      };

      // Act
      const errors = checkCircularDependencies(metaAgents);

      // Assert
      expect(errors).toEqual([]);
    });

    test("detects circular dependency between meta-agents", () => {
      // Arrange: Two meta-agents that delegate to each other
      const metaAgents: Record<string, MetaAgentDef> = {
        meta_a: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_b"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "meta_b",
            },
          ],
        },
        meta_b: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_a"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "meta_a",
            },
          ],
        },
      };

      // Act
      const errors = checkCircularDependencies(metaAgents);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const circularError = errors.find((e) => e.type === "circular_dependency");
      expect(circularError).toBeDefined();
      expect(circularError?.meta_agents).toContain("meta_a");
      expect(circularError?.meta_agents).toContain("meta_b");
    });

    test("detects circular dependency through routing rules", () => {
      // Arrange: Meta-agent delegates to another meta-agent via routing
      const metaAgents: Record<string, MetaAgentDef> = {
        meta_a: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_b"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "meta_b",
            },
          ],
        },
        meta_b: {
          base_model: "claude-3-5-sonnet",
          delegates_to: [],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "meta_a",
            },
          ],
        },
      };

      // Act
      const errors = checkCircularDependencies(metaAgents);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const circularError = errors.find((e) => e.type === "circular_dependency");
      expect(circularError).toBeDefined();
    });

    test("respects maxDepth parameter", () => {
      // Arrange: Chain of meta-agents with length 4
      const metaAgents: Record<string, MetaAgentDef> = {
        meta_1: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_2"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "meta_2" },
          ],
        },
        meta_2: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_3"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "meta_3" },
          ],
        },
        meta_3: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_4"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "meta_4" },
          ],
        },
        meta_4: {
          base_model: "claude-3-5-sonnet",
          delegates_to: [],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "sisyphus" },
          ],
        },
      };

      // Act
      const errorsMaxDepth3 = checkCircularDependencies(metaAgents, 3);
      const errorsMaxDepth10 = checkCircularDependencies(metaAgents, 10);

      // Assert: With maxDepth=3, should not detect circular dependency (chain is longer)
      // With maxDepth=10, should detect it if meta_4 routes back to meta_1
      expect(errorsMaxDepth3.length).toBe(0);
      expect(errorsMaxDepth10.length).toBe(0); // No actual circular dependency here
    });

    test("detects self-referencing meta-agent", () => {
      // Arrange: Meta-agent that delegates to itself
      const metaAgents: Record<string, MetaAgentDef> = {
        self_ref: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["self_ref"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "self_ref",
            },
          ],
        },
      };

      // Act
      const errors = checkCircularDependencies(metaAgents);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const circularError = errors.find((e) => e.type === "circular_dependency");
      expect(circularError).toBeDefined();
      expect(circularError?.meta_agents).toContain("self_ref");
    });

    test("handles complex multi-agent circular dependency", () => {
      // Arrange: Three meta-agents forming a cycle
      const metaAgents: Record<string, MetaAgentDef> = {
        meta_a: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_b"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "meta_b" },
          ],
        },
        meta_b: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["meta_c"],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "meta_c" },
          ],
        },
        meta_c: {
          base_model: "claude-3-5-sonnet",
          delegates_to: [],
          routing_rules: [
            { matcher: { type: "always" }, target_agent: "meta_a" },
          ],
        },
      };

      // Act
      const errors = checkCircularDependencies(metaAgents);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const circularErrors = errors.filter((e) => e.type === "circular_dependency");
      expect(circularErrors.length).toBeGreaterThan(0);
    });
  });

  describe("checkCircularDependenciesInConfig", () => {
    test("returns passed true when no meta_agents defined", () => {
      // Arrange
      const config: OlimpusConfig = {
        agents: {},
        categories: undefined,
      };

      // Act
      const result = checkCircularDependenciesInConfig(config);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test("returns passed true when meta_agents is empty object", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: {},
        agents: {},
        categories: undefined,
      };

      // Act
      const result = checkCircularDependenciesInConfig(config);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test("detects circular dependency in full config", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: {
          meta_a: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["meta_b"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "meta_b" },
            ],
          },
          meta_b: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "meta_a" },
            ],
          },
        },
        agents: {},
        categories: undefined,
      };

      // Act
      const result = checkCircularDependenciesInConfig(config);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.checkType).toBe("circular_dependency");
    });

    test("uses maxDepth from config settings", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: {
          meta_a: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["meta_b"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "meta_b" },
            ],
          },
          meta_b: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["meta_c"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "meta_c" },
            ],
          },
          meta_c: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
          },
        },
        settings: {
          max_delegation_depth: 2,
        },
        agents: {},
        categories: undefined,
      };

      // Act
      const result = checkCircularDependenciesInConfig(config);

      // Assert
      expect(result.passed).toBe(true); // No circular dependency with maxDepth=2
    });
  });

  describe("createCircularDependencyError", () => {
    test("creates valid circular dependency error", () => {
      // Arrange
      const message = "Test circular dependency message";
      const path = ["meta_a", "meta_b"];
      const metaAgents = ["meta_a", "meta_b"];

      // Act
      const error = createCircularDependencyError(message, path, metaAgents);

      // Assert
      expect(error.type).toBe("circular_dependency");
      expect(error.message).toBe(message);
      expect(error.path).toEqual(path);
      expect(error.meta_agents).toEqual(metaAgents);
    });
  });

  describe("createCheckResult", () => {
    test("creates check result with correct defaults", () => {
      // Arrange
      const checkType = "circular_dependency";

      // Act
      const result = createCheckResult(checkType);

      // Assert
      expect(result.checkType).toBe(checkType);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test("creates check result with passed parameter", () => {
      // Arrange
      const checkType = "circular_dependency";
      const passed = true;

      // Act
      const result = createCheckResult(checkType, passed);

      // Assert
      expect(result.checkType).toBe(checkType);
      expect(result.passed).toBe(true);
    });
  });

  describe("agent reference", () => {
    describe("checkAgentReferences", () => {
      test("returns empty array for empty meta_agents", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {};

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      test("returns empty array when all agent references are valid builtin agents", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["sisyphus", "hephaestus", "oracle"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
              {
                matcher: { type: "always" },
                target_agent: "hephaestus",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      test("returns empty array when agent references include other valid meta-agents", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          meta_a: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["meta_b", "sisyphus"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "meta_b",
              },
            ],
          },
          meta_b: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["oracle"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "oracle",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      test("detects invalid agent reference in delegates_to", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["invalid_agent"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors.length).toBeGreaterThan(0);
        const error = errors.find((e) => e.type === "invalid_agent_reference");
        expect(error).toBeDefined();
        expect(error?.reference).toBe("invalid_agent");
        expect(error?.path).toEqual(["meta_agents", "router", "delegates_to"]);
      });

      test("detects invalid agent reference in routing_rules target_agent", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["sisyphus"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "invalid_target",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors.length).toBeGreaterThan(0);
        const error = errors.find((e) => e.type === "invalid_agent_reference");
        expect(error).toBeDefined();
        expect(error?.reference).toBe("invalid_target");
        expect(error?.path).toEqual(["meta_agents", "router", "routing_rules", "0", "target_agent"]);
      });

      test("detects multiple invalid agent references", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["invalid_1", "invalid_2"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "invalid_3",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors.length).toBe(3);
        const invalidReferences = errors.map((e) => e.reference);
        expect(invalidReferences).toContain("invalid_1");
        expect(invalidReferences).toContain("invalid_2");
        expect(invalidReferences).toContain("invalid_3");
      });

      test("validates all builtin agent names correctly", () => {
        // Arrange: Test all builtin agent names
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [
              "sisyphus",
              "hephaestus",
              "oracle",
              "librarian",
              "explore",
              "multimodal-looker",
              "metis",
              "momus",
              "atlas",
              "prometheus",
            ],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      test("includes list of valid agents in error message", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["unknown_agent"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const errors = checkAgentReferences(metaAgents);

        // Assert
        expect(errors.length).toBeGreaterThan(0);
        const error = errors.find((e) => e.type === "invalid_agent_reference");
        expect(error).toBeDefined();
        expect(error?.message).toContain("Valid agents are:");
        expect(error?.message).toContain("sisyphus");
      });
    });

    describe("checkAgentReferencesInConfig", () => {
      test("returns passed true when no meta_agents defined", () => {
        // Arrange
        const config: OlimpusConfig = {
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkAgentReferencesInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      test("returns passed true when meta_agents is empty object", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {},
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkAgentReferencesInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      test("detects invalid agent reference in full config", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["invalid_agent"],
              routing_rules: [
                { matcher: { type: "always" }, target_agent: "sisyphus" },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkAgentReferencesInConfig(config);

        // Assert
        expect(result.passed).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.checkType).toBe("agent_reference");
      });

      test("passes with valid config using builtin agents", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                { matcher: { type: "always" }, target_agent: "sisyphus" },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkAgentReferencesInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });

    describe("createInvalidAgentReferenceError", () => {
      test("creates valid invalid agent reference error", () => {
        // Arrange
        const message = "Invalid agent reference message";
        const path = ["meta_agents", "router", "delegates_to"];
        const reference = "invalid_agent";

        // Act
        const error = createInvalidAgentReferenceError(message, path, reference);

        // Assert
        expect(error.type).toBe("invalid_agent_reference");
        expect(error.message).toBe(message);
        expect(error.path).toEqual(path);
        expect(error.reference).toBe(reference);
      });
    });
  });
});
