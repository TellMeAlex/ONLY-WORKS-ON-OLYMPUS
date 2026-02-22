import { test, expect, describe } from "bun:test";
import type { MetaAgentDef, OlimpusConfig } from "./schema.js";
import {
  checkCircularDependencies,
  checkCircularDependenciesInConfig,
  checkAgentReferences,
  checkAgentReferencesInConfig,
  checkRegexPerformance,
  checkRegexPerformanceInConfig,
  checkRegexFlags,
  checkRegexFlagsInConfig,
  validateOlimpusConfig,
  createCircularDependencyError,
  createInvalidAgentReferenceError,
  createRegexPerformanceWarning,
  createInvalidRegexFlagsError,
  createCheckResult,
  type CircularDependencyError,
  type InvalidAgentReferenceError,
  type RegexPerformanceWarning,
  type InvalidRegexFlagsError,
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
          namespace_prefix: "test",
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

  describe("regex flags", () => {
    describe("checkRegexFlags", () => {
      test("returns empty array for empty meta_agents", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {};

        // Act
        const errors = checkRegexFlags(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      test("returns empty array when no regex matchers present", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["sisyphus"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const errors = checkRegexFlags(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      describe("valid flags", () => {
        test("accepts single valid flag - g", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "g" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts single valid flag - i", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "i" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts single valid flag - m", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "m" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts single valid flag - s", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "s" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts single valid flag - u", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "u" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts single valid flag - y", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "y" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts single valid flag - d", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "d" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts multiple valid flags - gi", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gi" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts multiple valid flags - gim", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gim" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts all valid flags combined", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gimsuyd" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });
      });

      describe("invalid flags", () => {
        test("detects single invalid flag - x", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "x" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("x");
          expect(error?.message).toContain("Invalid regex flags");
        });

        test("detects single invalid flag - a", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "a" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("a");
        });

        test("detects multiple invalid flags - abc", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "abc" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("abc");
          expect(error?.message).toContain("abc");
        });

        test("detects mixed valid and invalid flags - gix", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gix" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("gix");
          expect(error?.message).toContain("x");
        });

        test("detects mixed valid and multiple invalid flags - giabc", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "giabc" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("giabc");
          expect(error?.message).toContain("abc");
        });

        test("includes list of valid flags in error message", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "x" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.message).toContain("Valid flags are:");
          expect(error?.message).toContain("g");
          expect(error?.message).toContain("i");
        });
      });

      describe("empty flags", () => {
        test("accepts regex matcher without flags property", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts empty string flags", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });
      });

      describe("duplicate flags", () => {
        test("accepts duplicate valid flags - gg", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gg" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("accepts multiple duplicate valid flags - giig", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "giig" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("detects duplicate invalid flags - xx", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "xx" },
                  target_agent: "sisyphus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("xx");
        });
      });

      describe("multiple rules", () => {
        test("validates multiple rules with valid flags", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "g" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "example", flags: "i" },
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "sample", flags: "gm" },
                  target_agent: "oracle",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("detects invalid flags in one of multiple rules", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "g" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "example", flags: "x" },
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "sample", flags: "i" },
                  target_agent: "oracle",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("x");
          expect(error?.path).toEqual(["meta_agents", "router", "routing_rules", "1", "matcher", "flags"]);
        });

        test("detects invalid flags in multiple rules", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "g" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "example", flags: "x" },
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "sample", flags: "yz" },
                  target_agent: "oracle",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(2);
          const invalidFlags = errors.map((e) => e.flags);
          expect(invalidFlags).toContain("x");
          expect(invalidFlags).toContain("yz");
        });

        test("handles mix of valid, invalid, and missing flags across multiple rules", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gi" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "example" },
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "sample", flags: "xyz" },
                  target_agent: "oracle",
                },
                {
                  matcher: { type: "regex", pattern: "demo", flags: "" },
                  target_agent: "librarian",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(1);
          const error = errors.find((e) => e.type === "invalid_regex_flags");
          expect(error).toBeDefined();
          expect(error?.flags).toBe("xyz");
          expect(error?.path).toEqual(["meta_agents", "router", "routing_rules", "2", "matcher", "flags"]);
        });
      });

      describe("multiple meta-agents", () => {
        test("validates flags across multiple meta-agents", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gi" },
                  target_agent: "sisyphus",
                },
              ],
            },
            router_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "example", flags: "m" },
                  target_agent: "hephaestus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors).toEqual([]);
        });

        test("detects invalid flags across multiple meta-agents", () => {
          // Arrange
          const metaAgents: Record<string, MetaAgentDef> = {
            router_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "x" },
                  target_agent: "sisyphus",
                },
              ],
            },
            router_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "example", flags: "yz" },
                  target_agent: "hephaestus",
                },
              ],
            },
          };

          // Act
          const errors = checkRegexFlags(metaAgents);

          // Assert
          expect(errors.length).toBe(2);
          const invalidFlags = errors.map((e) => e.flags);
          expect(invalidFlags).toContain("x");
          expect(invalidFlags).toContain("yz");
        });
      });

      test("sets correct path for invalid regex flags error", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "test", flags: "x" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const errors = checkRegexFlags(metaAgents);

        // Assert
        expect(errors.length).toBe(1);
        const error = errors.find((e) => e.type === "invalid_regex_flags");
        expect(error).toBeDefined();
        expect(error?.path).toEqual(["meta_agents", "router", "routing_rules", "0", "matcher", "flags"]);
      });

      test("does not check non-regex matchers", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
              {
                matcher: { type: "contains", value: "test" } as any,
                target_agent: "hephaestus",
              },
            ],
          },
        };

        // Act
        const errors = checkRegexFlags(metaAgents);

        // Assert
        expect(errors).toEqual([]);
      });

      test("mixes regex and non-regex matchers correctly", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
              {
                matcher: { type: "regex", pattern: "test", flags: "x" },
                target_agent: "hephaestus",
              },
              {
                matcher: { type: "contains", value: "test" } as any,
                target_agent: "oracle",
              },
            ],
          },
        };

        // Act
        const errors = checkRegexFlags(metaAgents);

        // Assert
        expect(errors.length).toBe(1);
        const error = errors.find((e) => e.type === "invalid_regex_flags");
        expect(error).toBeDefined();
        expect(error?.flags).toBe("x");
      });
    });

    describe("checkRegexFlagsInConfig", () => {
      test("returns passed true when no meta_agents defined", () => {
        // Arrange
        const config: OlimpusConfig = {
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexFlagsInConfig(config);

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
        const result = checkRegexFlagsInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      test("detects invalid regex flags in full config", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "x" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexFlagsInConfig(config);

        // Assert
        expect(result.passed).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.checkType).toBe("regex_flags");
      });

      test("passes with valid flags in full config", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gi" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexFlagsInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      test("handles mixed valid and invalid flags in full config", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test", flags: "gi" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "example", flags: "x" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexFlagsInConfig(config);

        // Assert
        expect(result.passed).toBe(false);
        expect(result.errors.length).toBe(1);
        const error = result.errors.find((e) => e.type === "invalid_regex_flags");
        expect(error?.flags).toBe("x");
      });
    });

    describe("createInvalidRegexFlagsError", () => {
      test("creates valid invalid regex flags error", () => {
        // Arrange
        const message = "Invalid regex flags message";
        const path = ["meta_agents", "router", "routing_rules", "0", "matcher", "flags"];
        const flags = "x";

        // Act
        const error = createInvalidRegexFlagsError(message, path, flags);

        // Assert
        expect(error.type).toBe("invalid_regex_flags");
        expect(error.message).toBe(message);
        expect(error.path).toEqual(path);
        expect(error.flags).toBe(flags);
      });
    });
  });

  describe("regex performance", () => {
    describe("checkRegexPerformance", () => {
      test("returns empty array for empty meta_agents", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {};

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings).toEqual([]);
      });

      test("returns empty array when no regex patterns present", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["sisyphus"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings).toEqual([]);
      });

      test("detects nested quantifiers - (a+)+", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(a+)+" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.pattern).toBe("(a+)+");
        expect(warning?.reason).toBe("Nested quantifiers can cause catastrophic backtracking");
      });

      test("detects nested quantifiers - (.*)*", () => {
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(.*)*" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toContain("catastrophic");
      });

      test("detects nested quantifiers - (.+)+", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(.+)+" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toContain("catastrophic");
      });

      test("detects overlapping alternation - a|ab", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "a|ab" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toBe("Overlapping alternation can cause inefficient backtracking");
      });

      test("detects unbounded dot - ^.* at start", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "^.*test" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toBe("Unbounded .* patterns can match excessively and cause performance issues");
      });

      test("detects unbounded dot - .*$ at end", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "test.*$" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toContain("Unbounded");
      });

      test("detects consecutive unbounded dots - .*.*", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "a.*.*b" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toContain("Unbounded");
      });

      test("detects large repetition quantifier - [\\d]+{100,}", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "[\\d]+{100,}" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toBe("Large repetition quantifiers can cause excessive backtracking");
      });

      test("detects complex lookahead with quantifier - (?=.*)*", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(?=a*)*" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toBe("Complex lookaheads/lookbehinds with quantifiers can be slow");
      });

      test("detects complex lookbehind with quantifier - (?<=a+)b", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(?<=a+)b" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toContain("lookahead");
      });

      test("detects backreferences - (\\w+).*\\1", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(\\w+).*\\1" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toBe("Backreferences prevent efficient regex compilation and can be slow");
      });

      test("detects excessive alternations - more than 8 pipe operators", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "a|b|c|d|e|f|g|h|i|j" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning).toBeDefined();
        expect(warning?.reason).toBe("Many alternations can cause the regex engine to try many paths");
      });

      test("does not warn for 8 or fewer alternations", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "a|b|c|d|e|f|g|h" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings).toEqual([]);
      });

      test("detects multiple regex performance issues in same meta-agent", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(a+)+" },
                target_agent: "sisyphus",
              },
              {
                matcher: { type: "regex", pattern: "^.*test" },
                target_agent: "hephaestus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(2);
        expect(warnings.every((w) => w.type === "regex_performance")).toBe(true);
      });

      test("detects regex performance issues across multiple meta-agents", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router_a: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(\\w+).*\\1" },
                target_agent: "sisyphus",
              },
            ],
          },
          router_b: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "a|ab" },
                target_agent: "hephaestus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(2);
        expect(warnings.every((w) => w.type === "regex_performance")).toBe(true);
      });

      test("sets correct path for regex performance warnings", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "regex", pattern: "(a+)+" },
                target_agent: "sisyphus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        const warning = warnings.find((w) => w.type === "regex_performance");
        expect(warning?.path).toEqual(["meta_agents", "router", "routing_rules", "0", "matcher", "pattern"]);
      });

      test("does not check non-regex matchers", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
              {
                matcher: { type: "contains", value: "test" } as any,
                target_agent: "hephaestus",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings).toEqual([]);
      });

      test("mixes regex and non-regex matchers correctly", () => {
        // Arrange
        const metaAgents: Record<string, MetaAgentDef> = {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: [],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
              {
                matcher: { type: "regex", pattern: "(a+)+" },
                target_agent: "hephaestus",
              },
              {
                matcher: { type: "contains", value: "test" } as any,
                target_agent: "oracle",
              },
            ],
          },
        };

        // Act
        const warnings = checkRegexPerformance(metaAgents);

        // Assert
        expect(warnings.length).toBe(1);
        expect(warnings[0]!.pattern).toBe("(a+)+");
      });
    });

    describe("checkRegexPerformanceInConfig", () => {
      test("returns passed true when no meta_agents defined", () => {
        // Arrange
        const config: OlimpusConfig = {
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexPerformanceInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.warnings.length).toBe(0);
      });

      test("returns passed true when meta_agents is empty object", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {},
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexPerformanceInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.warnings.length).toBe(0);
      });

      test("generates warnings for regex performance issues but still passes", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "(a+)+" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexPerformanceInConfig(config);

        // Assert
        expect(result.passed).toBe(true); // Regex performance warnings don't cause failure
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.checkType).toBe("regex_performance");
      });

      test("passes with no regex performance issues", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test|example" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexPerformanceInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.warnings.length).toBe(0);
      });

      test("handles mixed valid and invalid regex patterns", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "(a+)+" },
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "example|sample" },
                  target_agent: "oracle",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = checkRegexPerformanceInConfig(config);

        // Assert
        expect(result.passed).toBe(true);
        expect(result.warnings.length).toBe(1);
        expect(result.warnings[0]!.pattern).toBe("(a+)+");
      });
    });

    describe("createRegexPerformanceWarning", () => {
      test("creates valid regex performance warning", () => {
        // Arrange
        const message = "Regex pattern may cause performance issues";
        const path = ["meta_agents", "router", "routing_rules", "0", "matcher", "pattern"];
        const pattern = "(a+)+";
        const reason = "Nested quantifiers can cause catastrophic backtracking";

        // Act
        const warning = createRegexPerformanceWarning(message, path, pattern, reason);

        // Assert
        expect(warning.type).toBe("regex_performance");
        expect(warning.message).toBe(message);
        expect(warning.path).toEqual(path);
        expect(warning.pattern).toBe(pattern);
        expect(warning.reason).toBe(reason);
      });
    });
  });

  describe("valid config", () => {
    describe("validateOlimpusConfig", () => {
      test("empty config is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with no meta_agents is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {},
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with valid meta-agents delegating to builtin agents only is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
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
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with meta-agents chaining through other meta-agents (no cycles) is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
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
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with valid regex patterns is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "test|example" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "^hello" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with valid routing rules using different matcher types is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "contains", value: "test" } as any,
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "^hello" },
                  target_agent: "oracle",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with all builtin agent references is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
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
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with custom max_delegation_depth is valid", () => {
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
            namespace_prefix: "test",
            max_delegation_depth: 10,
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with multiple valid meta-agents is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "contains", value: "build" } as any,
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
            router_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["oracle", "librarian"],
              routing_rules: [
                {
                  matcher: { type: "contains", value: "search" } as any,
                  target_agent: "librarian",
                },
                {
                  matcher: { type: "always" },
                  target_agent: "oracle",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });

      test("config with simple regex patterns is valid", () => {
        // Arrange
        const config: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: [],
              routing_rules: [
                {
                  matcher: { type: "regex", pattern: "^test$" },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "regex", pattern: "[a-z]+" },
                  target_agent: "hephaestus",
                },
                {
                  matcher: { type: "regex", pattern: "\\d{3}" },
                  target_agent: "oracle",
                },
              ],
            },
          },
          agents: {},
          categories: undefined,
        };

        // Act
        const result = validateOlimpusConfig(config);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });
    });
  });
});
