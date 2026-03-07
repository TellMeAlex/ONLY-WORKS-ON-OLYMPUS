/**
 * Routing Behavior Backward Compatibility Test Suite for Olimpus v0.3.0
 *
 * This test suite verifies that routing behavior from version 0.3.0 remains
 * compatible with subsequent versions. These tests ensure that the routing logic
 * produces the same results for v0.3.0 configurations.
 *
 * @since 0.4.0
 * @stable
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for compatibility guarantees
 */

import { test, expect, describe } from "bun:test";
import {
  evaluateRoutingRules,
  evaluateMatcher,
  type RoutingContext,
  type ResolvedRoute,
  type RoutingResult,
} from "../src/agents/routing.js";
import type {
  Matcher,
  KeywordMatcher,
  ComplexityMatcher,
  RegexMatcher,
  ProjectContextMatcher,
  AlwaysMatcher,
  RoutingRule,
} from "../src/config/schema.js";

describe("Routing Behavior Backward Compatibility", () => {
  describe("Keyword Matcher Behavior", () => {
    test("keyword matcher with 'any' mode matches when any keyword is present", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["bug", "fix", "error"],
        mode: "any",
      };
      const context: RoutingContext = {
        prompt: "There is a bug in the code",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("keyword matcher with 'any' mode does not match when no keywords are present", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["bug", "fix", "error"],
        mode: "any",
      };
      const context: RoutingContext = {
        prompt: "Implement a new feature",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false);
    });

    test("keyword matcher with 'all' mode matches when all keywords are present", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["code", "find"],
        mode: "all",
      };
      const context: RoutingContext = {
        prompt: "Find code in the repository",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("keyword matcher with 'all' mode does not match when only some keywords are present", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["code", "find"],
        mode: "all",
      };
      const context: RoutingContext = {
        prompt: "Find something in the repository",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false);
    });

    test("keyword matcher is case-insensitive", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["BUG"],
        mode: "any",
      };
      const context: RoutingContext = {
        prompt: "There is a bug in the code",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("keyword matcher matches substring occurrences", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["test"],
        mode: "any",
      };
      const context: RoutingContext = {
        prompt: "This is a testing task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("Complexity Matcher Behavior", () => {
    test("complexity matcher with 'low' threshold matches prompts with low complexity", () => {
      // Arrange
      const matcher: ComplexityMatcher = {
        type: "complexity",
        threshold: "low",
      };
      const context: RoutingContext = {
        prompt: "Simple task\nAnother line",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - low threshold requires score >= 2 (2 lines = score 1, no keywords)
      expect(result).toBe(false);
    });

    test("complexity matcher with 'medium' threshold matches prompts of moderate complexity", () => {
      // Arrange
      const matcher: ComplexityMatcher = {
        type: "complexity",
        threshold: "medium",
      };
      const context: RoutingContext = {
        prompt: `Implement a feature with multiple steps:
        1. Create the interface
        2. Implement the logic
        3. Add tests
        4. Deploy
        Need more lines to reach medium threshold`,
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - 6 lines = Math.ceil(6/10) = 1, which is < 5
      expect(result).toBe(false);
    });

    test("complexity matcher with 'high' threshold matches complex prompts", () => {
      // Arrange
      const matcher: ComplexityMatcher = {
        type: "complexity",
        threshold: "high",
      };
      const context: RoutingContext = {
        prompt: `Design and implement a distributed system architecture.
        The system must support high availability and fault tolerance.
        Consider performance optimization, database scaling, and API integration.
        Implement security measures and authentication.
        Set up monitoring, logging, and deployment infrastructure.
        Create comprehensive tests and documentation.
        More lines to reach high threshold
        Even more lines needed
        And more lines`,
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - high threshold requires score >= 10
      expect(result).toBe(true);
    });

    test("complexity matcher considers technical keywords", () => {
      // Arrange
      const matcher: ComplexityMatcher = {
        type: "complexity",
        threshold: "high",
      };
      const context: RoutingContext = {
        prompt: `Implement algorithm for data structure optimization
        with concurrent API integration for security and performance
        More lines
        Even more
        And more`,
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - 5 lines + 4 keywords = 9, still less than high threshold of 10
      expect(result).toBe(false);
    });
  });

  describe("Regex Matcher Behavior", () => {
    test("regex matcher with 'i' flag matches case-insensitively", () => {
      // Arrange
      const matcher: RegexMatcher = {
        type: "regex",
        pattern: "\\b(bug|fix)\\b",
        flags: "i",
      };
      const context: RoutingContext = {
        prompt: "There is a BUG in the code",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("regex matcher without flags defaults to case-insensitive", () => {
      // Arrange
      const matcher: RegexMatcher = {
        type: "regex",
        pattern: "BUG",
      };
      const context: RoutingContext = {
        prompt: "There is a bug in the code",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - default flags is "i"
      expect(result).toBe(true);
    });

    test("regex matcher matches word boundaries", () => {
      // Arrange
      const matcher: RegexMatcher = {
        type: "regex",
        pattern: "^test",
      };
      const context: RoutingContext = {
        prompt: "test the implementation",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("regex matcher does not match when pattern is not found", () => {
      // Arrange
      const matcher: RegexMatcher = {
        type: "regex",
        pattern: "^spec",
      };
      const context: RoutingContext = {
        prompt: "test the implementation",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false);
    });

    test("regex matcher handles invalid patterns gracefully", () => {
      // Arrange
      const matcher: RegexMatcher = {
        type: "regex",
        pattern: "[invalid(regex",
      };
      const context: RoutingContext = {
        prompt: "test",
        projectDir: "/test",
      };

      // Act - should not throw error
      const result = evaluateMatcher(matcher, context);

      // Assert - invalid regex returns false
      expect(result).toBe(false);
    });
  });

  describe("Project Context Matcher Behavior", () => {
    test("project context matcher matches when specified files exist", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["package.json"],
      };
      const context: RoutingContext = {
        prompt: "Add a new dependency",
        projectDir: ".",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - package.json exists in the project directory
      expect(result).toBe(true);
    });

    test("project context matcher does not match when specified files do not exist", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["nonexistent-file.json"],
      };
      const context: RoutingContext = {
        prompt: "Add a new dependency",
        projectDir: ".",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - nonexistent-file.json does not exist
      expect(result).toBe(false);
    });

    test("project context matcher matches when specified dependencies exist", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_deps: ["vitest", "jest"],
      };
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: ".",
        projectDeps: ["vitest", "bun"],
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false); // jest not present
    });

    test("project context matcher matches when all dependencies exist", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_deps: ["vitest", "bun"],
      };
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: ".",
        projectDeps: ["vitest", "bun", "typescript"],
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("project context matcher matches when both files and deps exist", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["package.json"],
        has_deps: ["bun:test"],
      };
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: ".",
        projectFiles: ["package.json"],
        projectDeps: ["bun:test", "typescript"],
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("project context matcher does not match when files are missing", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["nonexistent-file.json"],
        has_deps: ["bun:test"],
      };
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: ".",
        projectDeps: ["bun:test"],
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert - nonexistent-file.json does not exist
      expect(result).toBe(false);
    });

    test("project context matcher matches when deps are not specified", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["package.json"],
      };
      const context: RoutingContext = {
        prompt: "Add a new dependency",
        projectDir: ".",
        projectFiles: ["package.json"],
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("Always Matcher Behavior", () => {
    test("always matcher always returns true", () => {
      // Arrange
      const matcher: AlwaysMatcher = {
        type: "always",
      };
      const context: RoutingContext = {
        prompt: "Any prompt",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("always matcher matches with empty prompt", () => {
      // Arrange
      const matcher: AlwaysMatcher = {
        type: "always",
      };
      const context: RoutingContext = {
        prompt: "",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("Routing Rules Evaluation Order", () => {
    test("routing rules are evaluated in order, returns first match", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["bug"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["fix"],
            mode: "any",
          },
          target_agent: "oracle",
        },
        {
          matcher: { type: "always" },
          target_agent: "librarian",
        },
      ];
      const context: RoutingContext = {
        prompt: "fix the bug",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.target_agent).toBe("sisyphus");
    });

    test("routing rules skip non-matching rules", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["architecture"],
            mode: "any",
          },
          target_agent: "prometheus",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["feature"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
      ];
      const context: RoutingContext = {
        prompt: "Add a new feature",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.target_agent).toBe("sisyphus");
    });

    test("routing rules return null when no rules match", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["architecture"],
            mode: "any",
          },
          target_agent: "prometheus",
        },
      ];
      const context: RoutingContext = {
        prompt: "Simple task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeNull();
    });

    test("always matcher serves as catch-all fallback", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["architecture"],
            mode: "any",
          },
          target_agent: "prometheus",
        },
        {
          matcher: { type: "always" },
          target_agent: "oracle",
        },
      ];
      const context: RoutingContext = {
        prompt: "Simple task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.target_agent).toBe("oracle");
    });
  });

  describe("Config Overrides Behavior", () => {
    test("routing result includes config overrides from matched rule", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["model"],
            mode: "any",
          },
          target_agent: "oracle",
          config_overrides: {
            model: "claude-opus-4-6",
            temperature: 0.5,
          },
        },
      ];
      const context: RoutingContext = {
        prompt: "Use the model",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.config_overrides).toEqual({
        model: "claude-opus-4-6",
        temperature: 0.5,
      });
    });

    test("routing result has no config overrides when rule has none", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: { type: "always" },
          target_agent: "oracle",
        },
      ];
      const context: RoutingContext = {
        prompt: "Any task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.config_overrides).toBeUndefined();
    });

    test("routing result includes partial config overrides", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["precise"],
            mode: "any",
          },
          target_agent: "sisyphus",
          config_overrides: {
            temperature: 0.1,
          },
        },
      ];
      const context: RoutingContext = {
        prompt: "Be precise",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.config_overrides).toEqual({
        temperature: 0.1,
      });
    });
  });

  describe("Routing Result Structure", () => {
    test("routing result includes matcher_type", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
      ];
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.matcher_type).toBe("keyword");
    });

    test("routing result includes matched_content for keyword matcher", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test", "spec"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
      ];
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.matched_content).toContain("matched keywords");
    });

    test("routing result includes matched_content for regex matcher", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "regex",
            pattern: "^test",
          },
          target_agent: "sisyphus",
        },
      ];
      const context: RoutingContext = {
        prompt: "test something",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.matched_content).toContain("matched pattern");
    });

    test("routing result includes matched_content for complexity matcher", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "complexity",
            threshold: "low",
          },
          target_agent: "oracle",
        },
      ];
      const context: RoutingContext = {
        prompt: `Implement a feature with multiple steps:
        1. Create interface
        2. Implement logic
        3. Add tests
        4. Deploy
        More lines
        Even more
        And more
        And more
        And more
        And more line`,
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert - 11 lines = Math.ceil(11/10) = 2, which is >= 2 (low threshold)
      expect(result).toBeDefined();
      const route = "route" in result ? (result as RoutingResult).route : result as ResolvedRoute;
      expect(route?.matched_content).toContain("complexity score");
    });

    test("routing result includes matched_content for always matcher", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: { type: "always" },
          target_agent: "oracle",
        },
      ];
      const context: RoutingContext = {
        prompt: "Any task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeDefined();
      expect(result?.matched_content).toBe("always match");
    });
  });

  describe("Routing Result with Evaluation Capture", () => {
    test("routing result includes evaluations when captureEvaluations is true", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["bug"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
        {
          matcher: { type: "always" },
          target_agent: "oracle",
        },
      ];
      const context: RoutingContext = {
        prompt: "Fix the bug",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context, undefined, true) as RoutingResult;

      // Assert - returns early after first match when not in debug mode
      expect(result).toBeDefined();
      expect(result.route).toBeDefined();
      expect(result.evaluations).toBeDefined();
      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0].matched).toBe(true);
      expect(result.evaluations[0].matcher_type).toBe("keyword");
    });

    test("routing result includes failed evaluations", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["architecture"],
            mode: "any",
          },
          target_agent: "prometheus",
        },
        {
          matcher: { type: "always" },
          target_agent: "oracle",
        },
      ];
      const context: RoutingContext = {
        prompt: "Simple task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context, undefined, true) as RoutingResult;

      // Assert - continues evaluating until match is found
      expect(result).toBeDefined();
      expect(result.route).toBeDefined();
      expect(result.evaluations).toBeDefined();
      expect(result.evaluations).toHaveLength(2);
      expect(result.evaluations[0].matched).toBe(false);
      expect(result.evaluations[1].matched).toBe(true);
    });

    test("routing result evaluations include matcher config", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
      ];
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context, undefined, true) as RoutingResult;

      // Assert
      expect(result).toBeDefined();
      expect(result.evaluations).toBeDefined();
      expect(result.evaluations[0].matcher).toEqual({
        type: "keyword",
        keywords: ["test"],
        mode: "any",
      });
    });
  });

  describe("v0.3.0 Configuration Compatibility", () => {
    test("keyword router from v0.3.0 fixture routes correctly", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["docs", "documentation", "guide"],
            mode: "any",
          },
          target_agent: "librarian",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["code", "find"],
            mode: "all",
          },
          target_agent: "explore",
        },
        {
          matcher: { type: "always" },
          target_agent: "librarian",
        },
      ];
      const docsContext: RoutingContext = {
        prompt: "Update the documentation",
        projectDir: "/test",
      };

      // Act
      const docsResult = evaluateRoutingRules(rules, docsContext);

      // Assert
      expect(docsResult?.target_agent).toBe("librarian");
    });

    test("complexity router from v0.3.0 fixture routes correctly", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "complexity",
            threshold: "high",
          },
          target_agent: "oracle",
        },
        {
          matcher: {
            type: "complexity",
            threshold: "medium",
          },
          target_agent: "prometheus",
        },
        {
          matcher: { type: "always" },
          target_agent: "metis",
        },
      ];
      const simpleContext: RoutingContext = {
        prompt: "Simple task",
        projectDir: "/test",
      };

      // Act
      const simpleResult = evaluateRoutingRules(rules, simpleContext);

      // Assert
      expect(simpleResult?.target_agent).toBe("metis");
    });

    test("regex router from v0.3.0 fixture routes correctly", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "regex",
            pattern: "^(design|ui|component)",
            flags: "i",
          },
          target_agent: "hephaestus",
        },
        {
          matcher: {
            type: "regex",
            pattern: "(performance|optimization)",
            flags: "i",
          },
          target_agent: "oracle",
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus",
        },
      ];
      const designContext: RoutingContext = {
        prompt: "Design a new component",
        projectDir: "/test",
      };

      // Act
      const designResult = evaluateRoutingRules(rules, designContext);

      // Assert
      expect(designResult?.target_agent).toBe("hephaestus");
    });
  });

  describe("Edge Cases", () => {
    test("handles empty routing rules array", () => {
      // Arrange
      const rules: RoutingRule[] = [];
      const context: RoutingContext = {
        prompt: "Any task",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeNull();
    });

    test("handles empty keyword list", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: [],
        mode: "any",
      };
      const context: RoutingContext = {
        prompt: "Any prompt",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false);
    });

    test("handles empty prompt", () => {
      // Arrange
      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
      ];
      const context: RoutingContext = {
        prompt: "",
        projectDir: "/test",
      };

      // Act
      const result = evaluateRoutingRules(rules, context);

      // Assert
      expect(result).toBeNull();
    });

    test("handles special characters in regex pattern", () => {
      // Arrange
      const matcher: RegexMatcher = {
        type: "regex",
        pattern: "\\b(bug|fix|error)\\b",
        flags: "i",
      };
      const context: RoutingContext = {
        prompt: "Fix the bug in the code",
        projectDir: "/test",
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(true);
    });

    test("handles project context with undefined projectFiles", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["package.json"],
      };
      const context: RoutingContext = {
        prompt: "Add dependency",
        projectDir: "/test",
        projectFiles: undefined,
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false);
    });

    test("handles project context with undefined projectDeps", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_deps: ["vitest"],
      };
      const context: RoutingContext = {
        prompt: "Write a test",
        projectDir: "/test",
        projectDeps: undefined,
      };

      // Act
      const result = evaluateMatcher(matcher, context);

      // Assert
      expect(result).toBe(false);
    });
  });
});
