import { test, expect, describe, beforeEach } from "bun:test";
import {
  checkConfigCompatibility,
  registerDeprecatedField,
  registerRemovedField,
  clearCompatibilityRegistry,
  getDeprecatedFields,
  getRemovedFields,
  createCompatibilityCheckResult,
  formatCompatibilityIssues,
  getCompatibilitySummary,
  hasIssuesOfType,
  filterIssuesBySeverity,
  type MigrationSuggestion,
  type CompatibilityCheckResult,
} from "./compatibility.js";
import type { OlimpusConfig } from "../config/schema.js";

describe("registerDeprecatedField", () => {
  beforeEach(() => {
    clearCompatibilityRegistry();
  });

  test("registers a deprecated field", () => {
    // Arrange
    const migration: MigrationSuggestion = {
      deprecatedPath: "meta_agents.agent.temperature",
      newPath: "config_overrides.temperature",
      description: "Move temperature to config_overrides",
      sinceVersion: "0.4.0",
      autoMigratable: true,
    };

    // Act
    registerDeprecatedField("meta_agents.agent.temperature", migration);

    // Assert
    const deprecated = getDeprecatedFields();
    expect(deprecated).toHaveProperty("meta_agents.agent.temperature");
    expect(deprecated["meta_agents.agent.temperature"]).toEqual(migration);
  });

  test("replaces existing registration", () => {
    // Arrange
    const migration1: MigrationSuggestion = {
      deprecatedPath: "old.path",
      newPath: "new.path",
      description: "First migration",
      sinceVersion: "0.4.0",
    };
    const migration2: MigrationSuggestion = {
      deprecatedPath: "old.path",
      newPath: "newer.path",
      description: "Second migration",
      sinceVersion: "0.5.0",
    };

    // Act
    registerDeprecatedField("old.path", migration1);
    registerDeprecatedField("old.path", migration2);

    // Assert
    const deprecated = getDeprecatedFields();
    expect(deprecated["old.path"]).toEqual(migration2);
  });

  test("registers multiple deprecated fields", () => {
    // Arrange
    const migration1: MigrationSuggestion = {
      deprecatedPath: "path1",
      newPath: "new1",
      description: "First",
      sinceVersion: "0.4.0",
    };
    const migration2: MigrationSuggestion = {
      deprecatedPath: "path2",
      newPath: "new2",
      description: "Second",
      sinceVersion: "0.4.0",
    };

    // Act
    registerDeprecatedField("path1", migration1);
    registerDeprecatedField("path2", migration2);

    // Assert
    const deprecated = getDeprecatedFields();
    expect(Object.keys(deprecated)).toHaveLength(2);
    expect(deprecated).toHaveProperty("path1");
    expect(deprecated).toHaveProperty("path2");
  });
});

describe("registerRemovedField", () => {
  beforeEach(() => {
    clearCompatibilityRegistry();
  });

  test("registers a removed field", () => {
    // Act
    registerRemovedField("settings.old_option", "0.4.0", "settings.new_option");

    // Assert
    const removed = getRemovedFields();
    expect(removed).toHaveProperty("settings.old_option");
    expect(removed["settings.old_option"]).toEqual({
      removedVersion: "0.4.0",
      replacement: "settings.new_option",
    });
  });

  test("registers a removed field without replacement", () => {
    // Act
    registerRemovedField("settings.obsolete", "0.4.0");

    // Assert
    const removed = getRemovedFields();
    expect(removed["settings.obsolete"]).toEqual({
      removedVersion: "0.4.0",
      replacement: undefined,
    });
  });

  test("replaces existing registration", () => {
    // Act
    registerRemovedField("path", "0.4.0", "replacement1");
    registerRemovedField("path", "0.5.0", "replacement2");

    // Assert
    const removed = getRemovedFields();
    expect(removed["path"]).toEqual({
      removedVersion: "0.5.0",
      replacement: "replacement2",
    });
  });
});

describe("getDeprecatedFields", () => {
  beforeEach(() => {
    clearCompatibilityRegistry();
  });

  test("returns empty object when no deprecated fields registered", () => {
    // Act
    const deprecated = getDeprecatedFields();

    // Assert
    expect(deprecated).toEqual({});
  });

  test("returns copy of deprecated fields", () => {
    // Arrange
    const migration: MigrationSuggestion = {
      deprecatedPath: "path",
      newPath: "new",
      description: "Test",
      sinceVersion: "0.4.0",
    };
    registerDeprecatedField("path", migration);
    const deprecated = getDeprecatedFields();

    // Act - modify returned object
    delete (deprecated as Record<string, unknown>).path;

    // Assert - original should not be affected
    const deprecated2 = getDeprecatedFields();
    expect(deprecated2).toHaveProperty("path");
  });
});

describe("getRemovedFields", () => {
  beforeEach(() => {
    clearCompatibilityRegistry();
  });

  test("returns empty object when no removed fields registered", () => {
    // Act
    const removed = getRemovedFields();

    // Assert
    expect(removed).toEqual({});
  });

  test("returns copy of removed fields", () => {
    // Arrange
    registerRemovedField("path", "0.4.0", "new");
    const removed = getRemovedFields();

    // Act - modify returned object
    delete (removed as Record<string, unknown>).path;

    // Assert - original should not be affected
    const removed2 = getRemovedFields();
    expect(removed2).toHaveProperty("path");
  });
});

describe("clearCompatibilityRegistry", () => {
  test("clears all deprecated fields", () => {
    // Arrange
    registerDeprecatedField("path1", {
      deprecatedPath: "path1",
      newPath: "new1",
      description: "Test",
      sinceVersion: "0.4.0",
    });
    registerDeprecatedField("path2", {
      deprecatedPath: "path2",
      newPath: "new2",
      description: "Test",
      sinceVersion: "0.4.0",
    });

    // Act
    clearCompatibilityRegistry();

    // Assert
    const deprecated = getDeprecatedFields();
    expect(deprecated).toEqual({});
  });

  test("clears all removed fields", () => {
    // Arrange
    registerRemovedField("path1", "0.4.0");
    registerRemovedField("path2", "0.4.0");

    // Act
    clearCompatibilityRegistry();

    // Assert
    const removed = getRemovedFields();
    expect(removed).toEqual({});
  });

  test("clears both deprecated and removed fields", () => {
    // Arrange
    registerDeprecatedField("path1", {
      deprecatedPath: "path1",
      newPath: "new1",
      description: "Test",
      sinceVersion: "0.4.0",
    });
    registerRemovedField("path2", "0.4.0");

    // Act
    clearCompatibilityRegistry();

    // Assert
    expect(getDeprecatedFields()).toEqual({});
    expect(getRemovedFields()).toEqual({});
  });
});

describe("checkConfigCompatibility", () => {
  beforeEach(() => {
    clearCompatibilityRegistry();
  });

  test("returns compatible result for empty config", () => {
    // Arrange
    const config: OlimpusConfig = {
      meta_agents: undefined,
      providers: undefined,
      settings: undefined,
      agents: undefined,
      categories: undefined,
      skills: undefined,
      disabled_hooks: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.compatible).toBe(true);
    expect(result.targetVersion).toBe("0.5.0");
    expect(result.issues).toHaveLength(0);
    expect(result.migrations).toHaveLength(0);
    expect(result.autoMigratable).toBe(true);
  });

  test("detects removed fields", () => {
    // Arrange
    registerRemovedField("settings.old_option", "0.4.0", "settings.new_option");
    const config: OlimpusConfig = {
      settings: { namespace_prefix: "olimpus", max_delegation_depth: 3, old_option: true } as OlimpusConfig["settings"],
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.compatible).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe("removed_field");
    expect(result.issues[0].path).toEqual(["settings", "old_option"]);
  });

  test("detects deprecated fields when includeDeprecated is true", () => {
    // Arrange
    registerDeprecatedField("meta_agents.agent.temperature", {
      deprecatedPath: "meta_agents.agent.temperature",
      newPath: "config_overrides.temperature",
      description: "Move temperature",
      sinceVersion: "0.4.0",
      autoMigratable: true,
    });
    const config: OlimpusConfig = {
      meta_agents: {
        agent: {
          base_model: "claude-3-5-sonnet-20241022",
          delegates_to: ["oracle"],
          routing_rules: [{ matcher: { type: "always" }, target_agent: "oracle" }],
          temperature: 0.7,
        },
      },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0", {
      includeDeprecated: true,
    });

    // Assert
    expect(result.compatible).toBe(true); // deprecated fields don't affect compatibility
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe("deprecated_field");
    expect(result.migrations).toHaveLength(1);
    expect(result.autoMigratable).toBe(true);
  });

  test("does not detect deprecated fields when includeDeprecated is false", () => {
    // Arrange
    registerDeprecatedField("meta_agents.agent.temperature", {
      deprecatedPath: "meta_agents.agent.temperature",
      newPath: "config_overrides.temperature",
      description: "Move temperature",
      sinceVersion: "0.4.0",
    });
    const config: OlimpusConfig = {
      meta_agents: {
        agent: {
          base_model: "claude-3-5-sonnet-20241022",
          delegates_to: ["oracle"],
          routing_rules: [{ matcher: { type: "always" }, target_agent: "oracle" }],
          temperature: 0.7,
        },
      },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0", {
      includeDeprecated: false,
    });

    // Assert
    expect(result.compatible).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.migrations).toHaveLength(0);
  });

  test("detects both removed and deprecated fields", () => {
    // Arrange
    registerRemovedField("settings.old_option", "0.4.0");
    registerDeprecatedField("meta_agents.agent.temperature", {
      deprecatedPath: "meta_agents.agent.temperature",
      newPath: "config_overrides.temperature",
      description: "Move temperature",
      sinceVersion: "0.4.0",
      autoMigratable: true,
    });
    const config: OlimpusConfig = {
      settings: { namespace_prefix: "olimpus", max_delegation_depth: 3, old_option: true } as OlimpusConfig["settings"],
      meta_agents: {
        agent: {
          base_model: "claude-3-5-sonnet-20241022",
          delegates_to: ["oracle"],
          routing_rules: [{ matcher: { type: "always" }, target_agent: "oracle" }],
          temperature: 0.7,
        },
      },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.compatible).toBe(false); // removed fields make it incompatible
    expect(result.issues).toHaveLength(2);
    expect(result.migrations).toHaveLength(1);
  });

  test("config with removed field is not auto-migratable", () => {
    // Arrange
    registerRemovedField("settings.old_option", "0.4.0");
    const config: OlimpusConfig = {
      settings: { namespace_prefix: "olimpus", max_delegation_depth: 3, old_option: true } as OlimpusConfig["settings"],
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.autoMigratable).toBe(false);
  });

  test("config with non-auto-migratable deprecated field", () => {
    // Arrange
    registerDeprecatedField("meta_agents.agent.temperature", {
      deprecatedPath: "meta_agents.agent.temperature",
      newPath: "config_overrides.temperature",
      description: "Manual migration required",
      sinceVersion: "0.4.0",
      autoMigratable: false,
    });
    const config: OlimpusConfig = {
      meta_agents: {
        agent: {
          base_model: "claude-3-5-sonnet-20241022",
          delegates_to: ["oracle"],
          routing_rules: [{ matcher: { type: "always" }, target_agent: "oracle" }],
          temperature: 0.7,
        },
      },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.autoMigratable).toBe(false);
  });

  test("config without issues is auto-migratable", () => {
    // Arrange
    const config: OlimpusConfig = {
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.autoMigratable).toBe(true);
  });
});

describe("checkConfigCompatibility - hasConfigValue", () => {
  beforeEach(() => {
    clearCompatibilityRegistry();
  });

  test("detects value at top level path", () => {
    // Arrange
    registerRemovedField("settings", "0.4.0");
    const config: OlimpusConfig = {
      settings: { namespace_prefix: "test", max_delegation_depth: 3 },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].path).toEqual(["settings"]);
  });

  test("detects value at nested path", () => {
    // Arrange
    registerRemovedField("settings.namespace_prefix", "0.4.0");
    const config: OlimpusConfig = {
      settings: { namespace_prefix: "test", max_delegation_depth: 3 },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].path).toEqual(["settings", "namespace_prefix"]);
  });

  test("returns false for undefined path", () => {
    // Arrange
    registerRemovedField("settings.nonexistent", "0.4.0");
    const config: OlimpusConfig = {
      settings: { namespace_prefix: "test", max_delegation_depth: 3 },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.issues).toHaveLength(0);
  });

  test("handles nested meta_agents path", () => {
    // Arrange
    registerRemovedField("meta_agents.agent.temperature", "0.4.0");
    const config: OlimpusConfig = {
      meta_agents: {
        agent: {
          base_model: "claude-3-5-sonnet-20241022",
          delegates_to: ["oracle"],
          routing_rules: [{ matcher: { type: "always" }, target_agent: "oracle" }],
          temperature: 0.7,
        },
      },
      agents: undefined,
      categories: undefined,
    };

    // Act
    const result = checkConfigCompatibility(config, "0.5.0");

    // Assert
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].path).toEqual(["meta_agents", "agent", "temperature"]);
  });
});

describe("createCompatibilityCheckResult", () => {
  test("creates compatible result by default", () => {
    // Act
    const result = createCompatibilityCheckResult("0.5.0");

    // Assert
    expect(result.compatible).toBe(true);
    expect(result.targetVersion).toBe("0.5.0");
    expect(result.issues).toEqual([]);
    expect(result.migrations).toEqual([]);
    expect(result.autoMigratable).toBe(true);
  });

  test("creates incompatible result when specified", () => {
    // Act
    const result = createCompatibilityCheckResult("0.5.0", false);

    // Assert
    expect(result.compatible).toBe(false);
    expect(result.targetVersion).toBe("0.5.0");
    expect(result.issues).toEqual([]);
    expect(result.migrations).toEqual([]);
  });
});

describe("formatCompatibilityIssues", () => {
  test("formats deprecated field issue", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "deprecated_field",
          path: ["meta_agents", "agent", "temperature"],
          message: "Field is deprecated",
          migration: {
            deprecatedPath: "meta_agents.agent.temperature",
            newPath: "config_overrides.temperature",
            description: "Move temperature",
            sinceVersion: "0.4.0",
          },
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toContain("[DEPRECATED]");
    expect(formatted[0]).toContain("meta_agents.agent.temperature");
    expect(formatted[0]).toContain("config_overrides.temperature");
  });

  test("formats removed field issue", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "removed_field",
          path: ["settings", "old_option"],
          message: "Field was removed",
          removedVersion: "0.4.0",
          replacement: "settings.new_option",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toContain("[REMOVED]");
    expect(formatted[0]).toContain("settings.old_option");
    expect(formatted[0]).toContain("v0.4.0");
    expect(formatted[0]).toContain("settings.new_option");
  });

  test("formats removed field without replacement", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "removed_field",
          path: ["settings", "obsolete"],
          message: "Field was removed",
          removedVersion: "0.4.0",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted[0]).toContain("[REMOVED]");
    expect(formatted[0]).toContain("v0.4.0");
    expect(formatted[0]).not.toContain("→"); // No replacement
  });

  test("formats invalid type issue", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "invalid_type",
          path: ["meta_agents", "agent"],
          message: "Invalid type",
          expectedType: "object",
          actualType: "string",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toContain("[TYPE ERROR]");
    expect(formatted[0]).toContain("Expected: object");
    expect(formatted[0]).toContain("Actual: string");
  });

  test("formats unknown field issue", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "unknown_field",
          path: ["meta_agents", "agent", "unknown_option"],
          message: "Unknown field",
          suggestion: "Check field name",
        },
      ],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toContain("[UNKNOWN]");
    expect(formatted[0]).toContain("Check field name");
  });

  test("formats unknown field without suggestion", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "unknown_field",
          path: ["meta_agents", "agent", "unknown_option"],
          message: "Unknown field",
        },
      ],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted[0]).toContain("[UNKNOWN]");
    expect(formatted[0]).not.toContain("Check"); // No suggestion text
  });

  test("formats multiple issues", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "deprecated_field",
          path: ["path1"],
          message: "Deprecated",
          migration: {
            deprecatedPath: "path1",
            newPath: "new1",
            description: "Migrate",
            sinceVersion: "0.4.0",
          },
        },
        {
          type: "removed_field",
          path: ["path2"],
          message: "Removed",
          removedVersion: "0.4.0",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const formatted = formatCompatibilityIssues(result);

    // Assert
    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toContain("[DEPRECATED]");
    expect(formatted[1]).toContain("[REMOVED]");
  });
});

describe("getCompatibilitySummary", () => {
  test("returns summary for compatible config with no issues", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const summary = getCompatibilitySummary(result);

    // Assert
    expect(summary).toContain("compatible");
    expect(summary).toContain("v0.5.0");
    expect(summary).toContain("No issues found");
  });

  test("returns summary for compatible config with issues", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "deprecated_field",
          path: ["path"],
          message: "Deprecated",
          migration: {
            deprecatedPath: "path",
            newPath: "new",
            description: "Migrate",
            sinceVersion: "0.4.0",
          },
        },
      ],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const summary = getCompatibilitySummary(result);

    // Assert
    expect(summary).toContain("compatible");
    expect(summary).toContain("v0.5.0");
    expect(summary).toContain("1 issue");
  });

  test("returns summary for incompatible config", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "removed_field",
          path: ["path"],
          message: "Removed",
          removedVersion: "0.4.0",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const summary = getCompatibilitySummary(result);

    // Assert
    expect(summary).toContain("NOT compatible");
    expect(summary).toContain("v0.5.0");
    expect(summary).toContain("must be resolved");
  });
});

describe("hasIssuesOfType", () => {
  test("returns true when issue of type exists", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "removed_field",
          path: ["path"],
          message: "Removed",
          removedVersion: "0.4.0",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const hasRemoved = hasIssuesOfType(result, "removed_field");

    // Assert
    expect(hasRemoved).toBe(true);
  });

  test("returns false when issue of type does not exist", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "deprecated_field",
          path: ["path"],
          message: "Deprecated",
          migration: {
            deprecatedPath: "path",
            newPath: "new",
            description: "Migrate",
            sinceVersion: "0.4.0",
          },
        },
      ],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const hasRemoved = hasIssuesOfType(result, "removed_field");

    // Assert
    expect(hasRemoved).toBe(false);
  });

  test("returns false when no issues exist", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const hasRemoved = hasIssuesOfType(result, "removed_field");

    // Assert
    expect(hasRemoved).toBe(false);
  });
});

describe("filterIssuesBySeverity", () => {
  test("separates errors and warnings correctly", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [
        {
          type: "removed_field",
          path: ["path1"],
          message: "Removed",
          removedVersion: "0.4.0",
        },
        {
          type: "invalid_type",
          path: ["path2"],
          message: "Invalid type",
          expectedType: "object",
          actualType: "string",
        },
        {
          type: "deprecated_field",
          path: ["path3"],
          message: "Deprecated",
          migration: {
            deprecatedPath: "path3",
            newPath: "new3",
            description: "Migrate",
            sinceVersion: "0.4.0",
          },
        },
        {
          type: "unknown_field",
          path: ["path4"],
          message: "Unknown",
        },
      ],
      migrations: [],
      autoMigratable: false,
    };

    // Act
    const { errors, warnings } = filterIssuesBySeverity(result);

    // Assert
    expect(errors).toHaveLength(2);
    expect(warnings).toHaveLength(2);
    expect(errors.every((e) => e.type === "removed_field" || e.type === "invalid_type")).toBe(true);
    expect(warnings.every((w) => w.type === "deprecated_field" || w.type === "unknown_field")).toBe(true);
  });

  test("returns empty arrays when no issues exist", () => {
    // Arrange
    const result: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [],
      migrations: [],
      autoMigratable: true,
    };

    // Act
    const { errors, warnings } = filterIssuesBySeverity(result);

    // Assert
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test("categorizes all issue types correctly", () => {
    // Test that all known issue types are categorized
    const removedFieldIssue = {
      type: "removed_field" as const,
      path: ["path"],
      message: "Removed",
      removedVersion: "0.4.0",
    };
    const invalidTypeIssue = {
      type: "invalid_type" as const,
      path: ["path"],
      message: "Invalid",
      expectedType: "object",
      actualType: "string",
    };
    const deprecatedFieldIssue = {
      type: "deprecated_field" as const,
      path: ["path"],
      message: "Deprecated",
      migration: {
        deprecatedPath: "path",
        newPath: "new",
        description: "Migrate",
        sinceVersion: "0.4.0",
      },
    };
    const unknownFieldIssue = {
      type: "unknown_field" as const,
      path: ["path"],
      message: "Unknown",
    };

    const result1: CompatibilityCheckResult = {
      compatible: false,
      targetVersion: "0.5.0",
      issues: [removedFieldIssue, invalidTypeIssue],
      migrations: [],
      autoMigratable: false,
    };

    const { errors } = filterIssuesBySeverity(result1);
    expect(errors).toHaveLength(2);

    const result2: CompatibilityCheckResult = {
      compatible: true,
      targetVersion: "0.5.0",
      issues: [deprecatedFieldIssue, unknownFieldIssue],
      migrations: [],
      autoMigratable: true,
    };

    const { warnings } = filterIssuesBySeverity(result2);
    expect(warnings).toHaveLength(2);
  });
});
