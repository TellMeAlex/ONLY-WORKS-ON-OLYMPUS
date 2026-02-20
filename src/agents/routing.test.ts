import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import {
  rmSync,
  existsSync,
  mkdtempSync,
  readFileSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { RoutingLogger, type MatcherEvaluation } from "./logger.js";
import { evaluateRoutingRules } from "./routing.js";
import type { RoutingLoggerConfig, RoutingRule } from "../config/schema.js";

describe("RoutingLogger", () => {
  let tempDir: string;
  let originalConsoleLog: typeof console.log;
  let logOutput: string[] = [];

  beforeEach(() => {
    // Save original console.log
    originalConsoleLog = console.log;

    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), "routing-test-"));

    // Capture console.log output
    logOutput = [];
    console.log = (...args: unknown[]) => {
      logOutput.push(args.map((arg) => String(arg)).join(" "));
    };
  });

  afterEach(() => {
    // Restore original console.log
    console.log = originalConsoleLog;

    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }

    // Clean up routing.log if it exists in current directory
    if (existsSync("routing.log")) {
      rmSync("routing.log", { force: true });
    }

    // Reset log output
    logOutput = [];
  });

  describe("constructor", () => {
    test("applies default config when no config provided", () => {
      // Act
      const logger = new RoutingLogger();

      // Assert
      expect(logger.isEnabled()).toBe(true);
      expect(logger.isDebugMode()).toBe(false);
    });

    test("applies default enabled: true", () => {
      // Arrange
      const config: RoutingLoggerConfig = {};
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(true);
    });

    test("applies default output: console", () => {
      // Arrange
      const config: RoutingLoggerConfig = {};
      // Act
      const logger = new RoutingLogger(config);

      // Assert: will log to console by default
      logger.logRoutingDecision("test-agent", "keyword", "matched: test");
      expect(logOutput.length).toBeGreaterThan(0);
    });

    test("applies default log_file: routing.log", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "file" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert: log should be written to routing.log
      logger.logRoutingDecision("test-agent", "keyword", "matched: test");
      expect(existsSync("routing.log")).toBe(true);
    });

    test("applies default debug_mode: false", () => {
      // Arrange
      const config: RoutingLoggerConfig = {};
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isDebugMode()).toBe(false);
    });

    test("accepts custom enabled: false", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: false };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(false);
    });

    test("accepts custom output: file", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "file" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(true);
    });

    test("accepts custom log_file path", () => {
      // Arrange
      const logFile = join(tempDir, "custom.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      // Act
      const logger = new RoutingLogger(config);
      logger.logRoutingDecision("test-agent", "keyword", "matched: test");

      // Assert
      expect(existsSync(logFile)).toBe(true);
    });

    test("accepts custom debug_mode: true", () => {
      // Arrange
      const config: RoutingLoggerConfig = { debug_mode: true };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isDebugMode()).toBe(true);
    });

    test("disabled output mode results in isEnabled false", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: true, output: "disabled" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert: even with enabled=true, disabled output means not enabled
      expect(logger.isEnabled()).toBe(false);
    });

    test("explicit enabled false overrides output mode", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: false, output: "console" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(false);
    });
  });

  describe("isEnabled", () => {
    test("returns true with default config", () => {
      // Act
      const logger = new RoutingLogger();

      // Assert
      expect(logger.isEnabled()).toBe(true);
    });

    test("returns false when enabled: false", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: false };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(false);
    });

    test("returns false when output: disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "disabled" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(false);
    });

    test("returns false when both enabled false and output disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "disabled",
      };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(false);
    });

    test("returns true with console output", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "console" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(true);
    });

    test("returns true with file output", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "file" };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isEnabled()).toBe(true);
    });
  });

  describe("isDebugMode", () => {
    test("returns false with default config", () => {
      // Act
      const logger = new RoutingLogger();

      // Assert
      expect(logger.isDebugMode()).toBe(false);
    });

    test("returns false when debug_mode: false explicitly", () => {
      // Arrange
      const config: RoutingLoggerConfig = { debug_mode: false };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isDebugMode()).toBe(false);
    });

    test("returns true when debug_mode: true", () => {
      // Arrange
      const config: RoutingLoggerConfig = { debug_mode: true };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isDebugMode()).toBe(true);
    });

    test("debug mode independent of enabled status", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: false,
        debug_mode: true,
      };
      // Act
      const logger = new RoutingLogger(config);

      // Assert
      expect(logger.isDebugMode()).toBe(true);
      expect(logger.isEnabled()).toBe(false);
    });
  });

  describe("logRoutingDecision - console output", () => {
    test("logs to console with basic params", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-a", "keyword", "matched: test");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      expect(logLine).toContain("agent-a");
      expect(logLine).toContain("keyword");
      expect(logLine).toContain("matched: test");
    });

    test("logs valid JSON", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-b", "regex", "matched: pattern");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      let parseError: unknown = null;
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(logLine);
      } catch (e) {
        parseError = e;
      }

      expect(parseError).toBeNull();
      expect(parsed).not.toBeNull();
      expect(typeof parsed).toBe("object");
    });

    test("includes timestamp in log", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-c", "complexity", "complexity >= 5");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe("string");
      // ISO format should have 'T' in it
      expect(parsed.timestamp).toContain("T");
    });

    test("includes config_overrides when provided", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision(
        "agent-d",
        "always",
        "always match",
        {
          model: "gpt-4",
          temperature: 0.5,
          prompt: "custom prompt",
          variant: "v1",
        }
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.config_overrides).toBeDefined();
      const overrides = parsed.config_overrides as Record<string, unknown>;
      expect(overrides.model).toBe("gpt-4");
      expect(overrides.temperature).toBe(0.5);
      expect(overrides.prompt).toBe("custom prompt");
      expect(overrides.variant).toBe("v1");
    });

    test("excludes config_overrides when not provided", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-e", "keyword", "matched: test");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.config_overrides).toBeUndefined();
    });

    test("includes partial config_overrides", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision(
        "agent-f",
        "regex",
        "matched: pattern",
        {
          model: "gpt-4",
          temperature: 0.7,
        }
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.config_overrides).toBeDefined();
      const overrides = parsed.config_overrides as Record<string, unknown>;
      expect(overrides.model).toBe("gpt-4");
      expect(overrides.temperature).toBe(0.7);
      expect(overrides.prompt).toBeUndefined();
      expect(overrides.variant).toBeUndefined();
    });

    test("console output includes all required fields", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-all-fields", "keyword", "matched");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.target_agent).toBe("agent-all-fields");
      expect(parsed.matcher_type).toBe("keyword");
      expect(parsed.matched_content).toBe("matched");
    });

    test("console output handles special characters in matched content", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });
      const specialContent = "matched: special \"quotes\" and 'apostrophes' \n newlines";

      // Act
      logger.logRoutingDecision("agent-special", "regex", specialContent);

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.matched_content).toBe(specialContent);
    });

    test("console output with all matcher types", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act - test all matcher types
      const matcherTypes = ["keyword", "regex", "complexity", "project_context", "always"];
      for (const type of matcherTypes) {
        logOutput = []; // Reset for each call
        logger.logRoutingDecision(`agent-${type}`, type, `matched: ${type}`);
        expect(logOutput.length).toBe(1);
        const logLine = logOutput[0]!;
        const parsed = JSON.parse(logLine) as Record<string, unknown>;
        expect(parsed.matcher_type).toBe(type);
      }
    });

    test("console output with debug mode includes debug_info", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-console-debug",
        "keyword",
        "matched: test",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.debug_info).toBeDefined();
      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(1);
    });

    test("console output does not create files", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-no-file", "always", "always match");

      // Assert - no routing.log file should be created for console output
      expect(existsSync("routing.log")).toBe(false);
    });

    test("console output timestamp is valid ISO format", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-timestamp", "keyword", "matched");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const timestamp = parsed.timestamp as string;
      expect(timestamp).toBeDefined();
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    test("console output handles empty strings in fields", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-empty", "", "");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.target_agent).toBe("agent-empty");
      expect(parsed.matcher_type).toBe("");
      expect(parsed.matched_content).toBe("");
    });
  });

  describe("logRoutingDecision - debug mode", () => {
    test("includes debug_info when debug mode enabled and evaluations provided", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-debug",
        "always",
        "always match",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.debug_info).toBeDefined();
      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(2);
      expect(Array.isArray(debugInfo.all_evaluated)).toBe(true);
      expect((debugInfo.all_evaluated as unknown[]).length).toBe(2);
    });

    test("excludes debug_info when debug mode disabled even with evaluations", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-nodebug",
        "keyword",
        "matched: test",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.debug_info).toBeUndefined();
    });

    test("excludes debug_info when debug mode enabled but no evaluations provided", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-noeval", "always", "always match");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.debug_info).toBeUndefined();
    });

    test("debug_info contains correct evaluation data", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["api", "test"], mode: "any" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-eval",
        "keyword",
        "matched keywords: api, test",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(1);

      const firstEval = allEvaluated[0] as Record<string, unknown>;
      expect(firstEval.matcher_type).toBe("keyword");
      expect(firstEval.matched).toBe(true);
    });

    test("includes all 5 matcher types in debug_info", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["api", "test"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^add" },
          matched: false,
        },
        {
          matcher_type: "complexity",
          matcher: { type: "complexity", threshold: "high" },
          matched: false,
        },
        {
          matcher_type: "project_context",
          matcher: { type: "project_context", has_files: ["src/**/*.ts"] },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-all-types",
        "always",
        "always match",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(5);

      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(5);

      // Verify each matcher type is present
      const matcherTypes = allEvaluated.map((e) => (e as Record<string, unknown>).matcher_type as string);
      expect(matcherTypes).toContain("keyword");
      expect(matcherTypes).toContain("regex");
      expect(matcherTypes).toContain("complexity");
      expect(matcherTypes).toContain("project_context");
      expect(matcherTypes).toContain("always");
    });

    test("preserves order of evaluated matchers", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["first"], mode: "any" },
          matched: true,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "second" },
          matched: false,
        },
        {
          matcher_type: "complexity",
          matcher: { type: "complexity", threshold: "medium" },
          matched: false,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-order",
        "keyword",
        "matched: first",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];

      expect((allEvaluated[0] as Record<string, unknown>).matcher_type).toBe("keyword");
      expect((allEvaluated[1] as Record<string, unknown>).matcher_type).toBe("regex");
      expect((allEvaluated[2] as Record<string, unknown>).matcher_type).toBe("complexity");
    });

    test("handles mix of matched and unmatched evaluations", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["wrong"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "wrong" },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-mixed",
        "always",
        "always match",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];

      expect((allEvaluated[0] as Record<string, unknown>).matched).toBe(false);
      expect((allEvaluated[1] as Record<string, unknown>).matched).toBe(false);
      expect((allEvaluated[2] as Record<string, unknown>).matched).toBe(true);
    });

    test("debug mode console output with all matchers and config overrides", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test", "api"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "test" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-debug-config",
        "regex",
        "matched: pattern",
        {
          model: "gpt-4",
          temperature: 0.7,
          prompt: "custom prompt",
        },
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      // Check config_overrides is present
      expect(parsed.config_overrides).toBeDefined();
      const overrides = parsed.config_overrides as Record<string, unknown>;
      expect(overrides.model).toBe("gpt-4");
      expect(overrides.temperature).toBe(0.7);
      expect(overrides.prompt).toBe("custom prompt");

      // Check debug_info is also present
      expect(parsed.debug_info).toBeDefined();
      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(2);
    });

    test("debug mode file output with all matchers", () => {
      // Arrange
      const logFile = join(tempDir, "debug-all-matchers.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^test" },
          matched: false,
        },
        {
          matcher_type: "complexity",
          matcher: { type: "complexity", threshold: "high" },
          matched: true,
        },
        {
          matcher_type: "project_context",
          matcher: { type: "project_context", has_files: ["*.ts"] },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-file-all",
        "complexity",
        "complexity >= high",
        undefined,
        evaluations
      );

      // Assert
      expect(existsSync(logFile)).toBe(true);
      const content = readFileSync(logFile, "utf-8");
      const parsed = JSON.parse(content.trim()) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(5);

      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(5);

      // Verify matcher objects are included
      const keywordMatcher = allEvaluated[0] as Record<string, unknown>;
      expect(keywordMatcher.matcher_type).toBe("keyword");
      const matcher = keywordMatcher.matcher as Record<string, unknown>;
      expect(matcher.type).toBe("keyword");
      expect(matcher.keywords).toBeDefined();
    });

    test("debug mode handles empty evaluations array", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [];

      // Act
      logger.logRoutingDecision(
        "agent-empty-eval",
        "always",
        "always match",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      // Empty evaluations should still include debug_info
      expect(parsed.debug_info).toBeDefined();
      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(0);
      expect((debugInfo.all_evaluated as unknown[]).length).toBe(0);
    });

    test("debug mode with single matcher evaluation", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-single",
        "always",
        "always match",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(1);

      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(1);
      expect((allEvaluated[0] as Record<string, unknown>).matcher_type).toBe("always");
    });

    test("debug mode matcher objects preserve all properties", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["api", "test"], mode: "any" },
          matched: true,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^test", flags: "i" },
          matched: false,
        },
        {
          matcher_type: "complexity",
          matcher: { type: "complexity", threshold: "high" },
          matched: false,
        },
        {
          matcher_type: "project_context",
          matcher: {
            type: "project_context",
            has_files: ["src/**/*.ts"],
            has_deps: ["lodash"],
          },
          matched: false,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-full-matchers",
        "keyword",
        "matched: api, test",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];

      // Verify keyword matcher has all properties
      const keywordEval = allEvaluated[0] as Record<string, unknown>;
      const keywordMatcher = keywordEval.matcher as Record<string, unknown>;
      expect(keywordMatcher.type).toBe("keyword");
      expect(keywordMatcher.keywords).toEqual(["api", "test"]);
      expect(keywordMatcher.mode).toBe("any");

      // Verify regex matcher has flags
      const regexEval = allEvaluated[1] as Record<string, unknown>;
      const regexMatcher = regexEval.matcher as Record<string, unknown>;
      expect(regexMatcher.flags).toBe("i");

      // Verify project_context matcher has both optional fields
      const projectEval = allEvaluated[3] as Record<string, unknown>;
      const projectMatcher = projectEval.matcher as Record<string, unknown>;
      expect(projectMatcher.has_files).toBeDefined();
      expect(projectMatcher.has_deps).toBeDefined();
    });
  });

  describe("logRoutingDecision - file output", () => {
    test("writes to file when output: file", () => {
      // Arrange
      const logFile = join(tempDir, "test.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-file", "keyword", "matched: test");

      // Assert
      expect(existsSync(logFile)).toBe(true);
      const content = readFileSync(logFile, "utf-8");
      expect(content).toContain("agent-file");
      expect(content).toContain("keyword");
      expect(content).toContain("matched: test");
    });

    test("creates new file if it doesn't exist", () => {
      // Arrange
      const logFile = join(tempDir, "new.log");
      expect(existsSync(logFile)).toBe(false);

      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-new", "always", "always match");

      // Assert
      expect(existsSync(logFile)).toBe(true);
    });

    test("appends to existing file", () => {
      // Arrange
      const logFile = join(tempDir, "append.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act - log twice
      logger.logRoutingDecision("agent-1", "keyword", "matched: first");
      logger.logRoutingDecision("agent-2", "regex", "matched: second");

      // Assert
      expect(existsSync(logFile)).toBe(true);
      const content = readFileSync(logFile, "utf-8");
      const lines = content.split("\n").filter((line) => line.length > 0);
      expect(lines.length).toBe(2);
      expect(lines[0]).toContain("agent-1");
      expect(lines[1]).toContain("agent-2");
    });

    test("separates entries with newlines", () => {
      // Arrange
      const logFile = join(tempDir, "newline.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-a", "keyword", "matched: a");
      logger.logRoutingDecision("agent-b", "keyword", "matched: b");

      // Assert
      const content = readFileSync(logFile, "utf-8");
      expect(content).toContain("\n");
      const lines = content.split("\n");
      expect(lines.length).toBe(3); // 2 entries + 1 empty string at end
    });

    test("writes valid JSON to file", () => {
      // Arrange
      const logFile = join(tempDir, "json.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-json", "always", "always match");

      // Assert
      const content = readFileSync(logFile, "utf-8");
      let parseError: unknown = null;
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(content.trim());
      } catch (e) {
        parseError = e;
      }

      expect(parseError).toBeNull();
      expect(parsed).not.toBeNull();
    });

    test("includes all fields in file output", () => {
      // Arrange
      const logFile = join(tempDir, "fields.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision(
        "agent-fields",
        "keyword",
        "matched: test",
        {
          model: "gpt-4",
          temperature: 0.8,
        }
      );

      // Assert
      const content = readFileSync(logFile, "utf-8");
      const parsed = JSON.parse(content.trim()) as Record<string, unknown>;

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.target_agent).toBe("agent-fields");
      expect(parsed.matcher_type).toBe("keyword");
      expect(parsed.matched_content).toBe("matched: test");
      expect(parsed.config_overrides).toBeDefined();
    });

    test("includes debug_info in file when debug mode enabled", () => {
      // Arrange
      const logFile = join(tempDir, "debug-file.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-debug-file",
        "keyword",
        "matched: test",
        undefined,
        evaluations
      );

      // Assert
      const content = readFileSync(logFile, "utf-8");
      const parsed = JSON.parse(content.trim()) as Record<string, unknown>;

      expect(parsed.debug_info).toBeDefined();
    });
  });

  describe("logRoutingDecision - disabled output", () => {
    test("does not log when enabled: false", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: false, output: "console" };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-disabled", "always", "always match");

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not log when output: disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "disabled" };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-no-output", "always", "always match");

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not log when both enabled false and output disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "disabled",
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision(
        "agent-fully-disabled",
        "always",
        "always match"
      );

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not write to file when disabled", () => {
      // Arrange
      const logFile = join(tempDir, "disabled-file.log");
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-disabled-file", "always", "always match");

      // Assert
      expect(existsSync(logFile)).toBe(false);
    });

    test("does not log multiple times when disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: false, output: "console" };
      const logger = new RoutingLogger(config);

      // Act - log multiple times
      for (let i = 0; i < 5; i++) {
        logger.logRoutingDecision(
          `agent-${i}`,
          "keyword",
          `matched: test-${i}`
        );
      }

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not log with config_overrides when disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = { enabled: false, output: "console" };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision(
        "agent-disabled-config",
        "keyword",
        "matched: test",
        {
          model: "gpt-4",
          temperature: 0.5,
        }
      );

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not log with debug_info when disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-disabled-debug",
        "keyword",
        "matched: test",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not log with all matcher types when disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = { output: "disabled" };
      const logger = new RoutingLogger(config);

      // Act - test all matcher types
      const matcherTypes = ["keyword", "regex", "complexity", "project_context", "always"];
      for (const type of matcherTypes) {
        logger.logRoutingDecision(`agent-${type}`, type, `matched: ${type}`);
      }

      // Assert
      expect(logOutput.length).toBe(0);
    });

    test("does not log to file with config_overrides when disabled", () => {
      // Arrange
      const logFile = join(tempDir, "disabled-with-override.log");
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision(
        "agent-disabled-file-config",
        "keyword",
        "matched: test",
        {
          model: "claude-3",
          prompt: "test prompt",
        }
      );

      // Assert
      expect(existsSync(logFile)).toBe(false);
    });

    test("does not log to file with debug_info when disabled", () => {
      // Arrange
      const logFile = join(tempDir, "disabled-with-debug.log");
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^test" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-disabled-file-debug",
        "regex",
        "matched: pattern",
        undefined,
        evaluations
      );

      // Assert
      expect(existsSync(logFile)).toBe(false);
    });

    test("does not create default routing.log when disabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: false,
        output: "file",
      };
      const logger = new RoutingLogger(config);

      // Act
      logger.logRoutingDecision("agent-disabled-default", "always", "always match");

      // Assert - default routing.log should not be created when disabled
      expect(existsSync("routing.log")).toBe(false);
    });

    test("disabled logger ignores output mode changes", () => {
      // Arrange
      const logger = new RoutingLogger({ enabled: false });

      // Act - try logging with output: console
      logger.logRoutingDecision("agent-disabled-1", "keyword", "matched: 1");

      // Act - try logging with output: file
      logger.logRoutingDecision("agent-disabled-2", "keyword", "matched: 2");

      // Act - try logging with output: disabled
      logger.logRoutingDecision("agent-disabled-3", "keyword", "matched: 3");

      // Assert
      expect(logOutput.length).toBe(0);
      expect(existsSync("routing.log")).toBe(false);
    });
  });

  describe("logRoutingDecision - error handling", () => {
    test("handles file write errors gracefully", () => {
      // Arrange: use an invalid path that can't be written to
      // Note: This test depends on OS permissions, may not fail on all systems
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: "/root/cannot-write-here.log", // Usually permission denied
      };
      const logger = new RoutingLogger(config);

      // Act & Assert: Should NOT throw
      let error: unknown = null;
      try {
        logger.logRoutingDecision("agent-error", "always", "always match");
      } catch (e) {
        error = e;
      }

      expect(error).toBeNull();
    });

    test("handles unknown output mode gracefully", () => {
      // Arrange: cast to unknown output mode (invalid)
      const config = {
        output: "unknown" as any,
      };
      const logger = new RoutingLogger(config);

      // Act & Assert: Should NOT throw
      let error: unknown = null;
      try {
        logger.logRoutingDecision("agent-unknown", "always", "always match");
      } catch (e) {
        error = e;
      }

      expect(error).toBeNull();
    });

    test("can be called multiple times without error", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act & Assert: Call many times
      let error: unknown = null;
      try {
        for (let i = 0; i < 10; i++) {
          logger.logRoutingDecision(
            `agent-${i}`,
            "keyword",
            `matched: test-${i}`
          );
        }
      } catch (e) {
        error = e;
      }

      expect(error).toBeNull();
      expect(logOutput.length).toBe(10);
    });
  });

  describe("logRoutingDecision - log entry structure", () => {
    test("produces valid RoutingLogEntry structure", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision("agent-struct", "keyword", "matched: test");

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      // Check required fields
      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe("string");

      expect(parsed.target_agent).toBeDefined();
      expect(typeof parsed.target_agent).toBe("string");

      expect(parsed.matcher_type).toBeDefined();
      expect(typeof parsed.matcher_type).toBe("string");

      expect(parsed.matched_content).toBeDefined();
      expect(typeof parsed.matched_content).toBe("string");
    });

    test("config_overrides has correct structure when provided", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act
      logger.logRoutingDecision(
        "agent-override",
        "always",
        "always match",
        {
          model: "claude-3",
          temperature: 0.3,
          prompt: "system prompt",
          variant: "pro",
        }
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.config_overrides).toBeDefined();
      const overrides = parsed.config_overrides as Record<string, unknown>;

      // Each field should have correct type
      expect(overrides.model).toBeDefined();
      expect(typeof overrides.model).toBe("string");

      expect(overrides.temperature).toBeDefined();
      expect(typeof overrides.temperature).toBe("number");

      expect(overrides.prompt).toBeDefined();
      expect(typeof overrides.prompt).toBe("string");

      expect(overrides.variant).toBeDefined();
      expect(typeof overrides.variant).toBe("string");
    });

    test("debug_info has correct structure when enabled", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["a"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^test" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "agent-debug-struct",
        "regex",
        "matched: pattern",
        undefined,
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.debug_info).toBeDefined();
      const debugInfo = parsed.debug_info as Record<string, unknown>;

      expect(debugInfo.total_evaluated).toBeDefined();
      expect(typeof debugInfo.total_evaluated).toBe("number");
      expect(debugInfo.total_evaluated).toBe(2);

      expect(debugInfo.all_evaluated).toBeDefined();
      expect(Array.isArray(debugInfo.all_evaluated)).toBe(true);
      expect((debugInfo.all_evaluated as unknown[]).length).toBe(2);
    });
  });

  describe("integration tests", () => {
    test("full workflow with console output and debug mode", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["api"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "default-agent",
        "always",
        "always match",
        {
          model: "gpt-4",
          temperature: 0.7,
        },
        evaluations
      );

      // Assert
      expect(logOutput.length).toBe(1);
      const logLine = logOutput[0]!;
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.target_agent).toBe("default-agent");
      expect(parsed.matcher_type).toBe("always");
      expect(parsed.matched_content).toBe("always match");
      expect(parsed.config_overrides).toBeDefined();
      expect(parsed.debug_info).toBeDefined();

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(2);
    });

    test("full workflow with file output and debug mode", () => {
      // Arrange
      const logFile = join(tempDir, "integration.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^(add|create)" },
          matched: true,
        },
      ];

      // Act
      logger.logRoutingDecision(
        "creator-agent",
        "regex",
        "matched: pattern",
        {
          model: "claude-3",
          variant: "op",
        },
        evaluations
      );

      // Assert
      expect(existsSync(logFile)).toBe(true);
      const content = readFileSync(logFile, "utf-8");
      const parsed = JSON.parse(content.trim()) as Record<string, unknown>;

      expect(parsed.target_agent).toBe("creator-agent");
      expect(parsed.matcher_type).toBe("regex");
      expect(parsed.debug_info).toBeDefined();
    });

    test("can log to console and file from separate logger instances", () => {
      // Arrange
      const logFile = join(tempDir, "separate.log");
      const consoleLogger = new RoutingLogger({ output: "console" });
      const fileLogger = new RoutingLogger({
        output: "file",
        log_file: logFile,
      });

      // Act
      consoleLogger.logRoutingDecision("agent-console", "keyword", "matched");
      fileLogger.logRoutingDecision("agent-file", "keyword", "matched");

      // Assert
      expect(logOutput.length).toBe(1);
      expect(logOutput[0]!).toContain("agent-console");
      expect(existsSync(logFile)).toBe(true);

      const fileContent = readFileSync(logFile, "utf-8");
      expect(fileContent).toContain("agent-file");
      expect(fileContent).not.toContain("agent-console");
    });
  });

  describe("performance", () => {
    test("console logging overhead < 5ms", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision("agent-perf", "keyword", "matched: test");
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });

    test("console logging with debug_info overhead < 5ms", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test", "api"], mode: "any" },
          matched: true,
        },
        {
          matcher_type: "regex",
          matcher: { type: "regex", pattern: "^test" },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: false,
        },
      ];

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision(
        "agent-perf-debug",
        "keyword",
        "matched: test, api",
        undefined,
        evaluations
      );
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });

    test("file logging overhead < 5ms", () => {
      // Arrange
      const logFile = join(tempDir, "perf-file.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
      };
      const logger = new RoutingLogger(config);

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision("agent-perf-file", "keyword", "matched: test");
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });

    test("file logging with debug_info overhead < 5ms", () => {
      // Arrange
      const logFile = join(tempDir, "perf-file-debug.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["test"], mode: "any" },
          matched: false,
        },
        {
          matcher_type: "always",
          matcher: { type: "always" },
          matched: true,
        },
      ];

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision(
        "agent-perf-file-debug",
        "always",
        "always match",
        undefined,
        evaluations
      );
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });

    test("disabled logger overhead < 5ms", () => {
      // Arrange
      const logger = new RoutingLogger({ enabled: false });

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision("agent-perf-disabled", "keyword", "matched: test");
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });

    test("console logging with config_overrides overhead < 5ms", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision(
        "agent-perf-config",
        "keyword",
        "matched: test",
        {
          model: "gpt-4",
          temperature: 0.7,
          prompt: "custom prompt",
          variant: "pro",
        }
      );
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });

    test("multiple consecutive console logs all < 5ms", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });
      const overheads: number[] = [];

      // Act - measure multiple logs
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        logger.logRoutingDecision(
          `agent-perf-multi-${i}`,
          "keyword",
          `matched: test-${i}`
        );
        const end = performance.now();
        overheads.push(end - start);
      }

      // Assert - all should be under 5ms
      overheads.forEach((overhead, index) => {
        expect(overhead).toBeLessThan(5);
      });
    });

    test("average overhead over 10 calls < 5ms", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act - measure average time
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        logger.logRoutingDecision(
          `agent-perf-avg-${i}`,
          "keyword",
          `matched: test-${i}`
        );
      }
      const end = performance.now();

      const average = (end - start) / 10;

      // Assert
      expect(average).toBeLessThan(5);
    });

    test("file logging with config_overrides and debug_info overhead < 5ms", () => {
      // Arrange
      const logFile = join(tempDir, "perf-full.log");
      const config: RoutingLoggerConfig = {
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(config);

      const evaluations: MatcherEvaluation[] = [
        {
          matcher_type: "keyword",
          matcher: { type: "keyword", keywords: ["api", "test"], mode: "any" },
          matched: true,
        },
      ];

      // Act - measure time
      const start = performance.now();
      logger.logRoutingDecision(
        "agent-perf-full",
        "keyword",
        "matched: api, test",
        {
          model: "claude-3",
          temperature: 0.5,
          prompt: "system prompt",
        },
        evaluations
      );
      const end = performance.now();

      // Assert
      const overhead = end - start;
      expect(overhead).toBeLessThan(5);
    });
  });

  describe("E2E: Verify all routing decisions are logged with required fields", () => {
    test("keyword matcher routing decision logs timestamp, matcher_type, matched_content, and target_agent", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["bug", "fix", "debug"],
            mode: "any",
          },
          target_agent: "debug-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Please fix this bug in the authentication module",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify all required fields are present
      expect(logEntry.timestamp).toBeDefined();
      expect(typeof logEntry.timestamp).toBe("string");
      expect(logEntry.target_agent).toBe("debug-agent");
      expect(typeof logEntry.target_agent).toBe("string");
      expect(logEntry.matcher_type).toBe("keyword");
      expect(typeof logEntry.matcher_type).toBe("string");
      expect(logEntry.matched_content).toBeDefined();
      expect(typeof logEntry.matched_content).toBe("string");

      // Verify timestamp is valid ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(isoRegex.test(logEntry.timestamp as string)).toBe(true);
    });

    test("regex matcher routing decision logs all required fields with valid JSON", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "regex",
            pattern: "\\b(API|api)\\b",
            flags: "i",
          },
          target_agent: "api-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Create a new API endpoint for user authentication",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);

      // Verify log is valid JSON
      let logEntry: Record<string, unknown>;
      expect(() => {
        logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;
      }).not.toThrow();

      logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify all required fields
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.target_agent).toBe("api-agent");
      expect(logEntry.matcher_type).toBe("regex");
      expect(logEntry.matched_content).toBeDefined();
      expect((logEntry.matched_content as string)).toContain("matched pattern:");
    });

    test("complexity matcher routing decision logs all required fields", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "complexity",
            threshold: "high",
          },
          target_agent: "senior-agent",
        },
      ];

      const complexPrompt = `
This is a complex architectural task involving:
- System architecture design
- Performance optimization strategies
- Database integration and concurrency handling
- Security and encryption implementation
- Testing infrastructure and deployment pipeline
- API integration patterns
- Authentication and authorization systems
- Infrastructure and scaling considerations
- Code refactoring and debugging approaches
- Profiling and tracing mechanisms
      `.trim();

      // Act
      evaluateRoutingRules(rules, {
        prompt: complexPrompt,
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify all required fields
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.target_agent).toBe("senior-agent");
      expect(logEntry.matcher_type).toBe("complexity");
      expect(logEntry.matched_content).toBeDefined();
      expect((logEntry.matched_content as string)).toContain("complexity score >=");
    });

    test("always matcher routing decision logs all required fields", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: { type: "always" },
          target_agent: "default-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Any prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify all required fields
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.target_agent).toBe("default-agent");
      expect(logEntry.matcher_type).toBe("always");
      expect(logEntry.matched_content).toBe("always match");
    });

    test("multiple routing decisions all logged with required fields", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["deploy"],
            mode: "any",
          },
          target_agent: "deploy-agent",
        },
        {
          matcher: { type: "always" },
          target_agent: "default-agent",
        },
      ];

      const prompts = [
        "Write unit tests for the API",
        "Deploy the application to production",
        "Build a new feature",
      ];

      // Act
      for (const prompt of prompts) {
        evaluateRoutingRules(rules, {
          prompt,
          projectDir: "/test/project",
        }, logger);
      }

      // Assert
      expect(logOutput.length).toBe(prompts.length);

      // Verify each log entry has all required fields
      for (let i = 0; i < logOutput.length; i++) {
        const logEntry = JSON.parse(logOutput[i]!) as Record<string, unknown>;
        expect(logEntry.timestamp).toBeDefined();
        expect(typeof logEntry.timestamp).toBe("string");
        expect(logEntry.target_agent).toBeDefined();
        expect(typeof logEntry.target_agent).toBe("string");
        expect(logEntry.matcher_type).toBeDefined();
        expect(typeof logEntry.matcher_type).toBe("string");
        expect(logEntry.matched_content).toBeDefined();
        expect(typeof logEntry.matched_content).toBe("string");
      }
    });

    test("log output with special characters is valid JSON and contains all fields", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: 'Test with "quotes" and \'apostrophes\' and newlines\nand tabs\t',
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);

      // Verify JSON is parseable even with special characters
      let logEntry: Record<string, unknown>;
      expect(() => {
        logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;
      }).not.toThrow();

      logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify all required fields
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.target_agent).toBe("test-agent");
      expect(logEntry.matcher_type).toBe("keyword");
      expect(logEntry.matched_content).toBeDefined();
    });
  });

  describe("E2E: Verify log output can be configured (console, file, disabled)", () => {
    test("console output - logs appear in console", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "This is a test prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert - logs should appear in console (captured in logOutput)
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify log entry contains expected fields
      expect(logEntry.target_agent).toBe("test-agent");
      expect(logEntry.matcher_type).toBe("keyword");
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.matched_content).toBeDefined();

      // Verify no file was created for console output
      expect(existsSync("routing.log")).toBe(false);
    });

    test("file output - logs are written to file", () => {
      // Arrange
      const logFile = join(tempDir, "e2e-routing.log");
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "file",
        log_file: logFile,
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "regex",
            pattern: "deploy",
            flags: "i",
          },
          target_agent: "deploy-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Deploy this to production",
        projectDir: "/test/project",
      }, logger);

      // Assert - logs should be written to file
      expect(existsSync(logFile)).toBe(true);

      // Verify console output is empty for file output
      expect(logOutput.length).toBe(0);

      // Verify file content is valid JSON with expected fields
      const fileContent = readFileSync(logFile, "utf-8");
      const logLines = fileContent.trim().split("\n");
      expect(logLines.length).toBeGreaterThan(0);

      const logEntry = JSON.parse(logLines[0]!) as Record<string, unknown>;
      expect(logEntry.target_agent).toBe("deploy-agent");
      expect(logEntry.matcher_type).toBe("regex");
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.matched_content).toBeDefined();
    });

    test("file output - multiple logs are appended to file", () => {
      // Arrange
      const logFile = join(tempDir, "e2e-multi.log");
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "file",
        log_file: logFile,
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["debug"],
            mode: "any",
          },
          target_agent: "debug-agent",
        },
      ];

      // Act - make multiple routing decisions
      evaluateRoutingRules(rules, {
        prompt: "This is a test",
        projectDir: "/test/project",
      }, logger);

      evaluateRoutingRules(rules, {
        prompt: "This is for debugging",
        projectDir: "/test/project",
      }, logger);

      // Assert - both logs should be in the file
      expect(existsSync(logFile)).toBe(true);

      const fileContent = readFileSync(logFile, "utf-8");
      const logLines = fileContent.trim().split("\n");
      expect(logLines.length).toBe(2);

      const logEntry1 = JSON.parse(logLines[0]!) as Record<string, unknown>;
      const logEntry2 = JSON.parse(logLines[1]!) as Record<string, unknown>;

      expect(logEntry1.target_agent).toBe("test-agent");
      expect(logEntry2.target_agent).toBe("debug-agent");
    });

    test("disabled logging - no logs are produced", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: false,
        output: "console",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "This is a test prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert - no console output
      expect(logOutput.length).toBe(0);

      // No file should be created
      expect(existsSync("routing.log")).toBe(false);
    });

    test("disabled output mode - no logs are produced even with enabled: true", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "disabled",
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "This is a test prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert - no console output even though enabled: true
      expect(logOutput.length).toBe(0);

      // No file should be created
      expect(existsSync("routing.log")).toBe(false);
    });

    test("file output with custom path - logs written to specified file", () => {
      // Arrange
      const customLogFile = join(tempDir, "logs", "custom-routing.log");
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "file",
        log_file: customLogFile,
        debug_mode: false,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "complexity",
            threshold: "low",
          },
          target_agent: "junior-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Simple task",
        projectDir: "/test/project",
      }, logger);

      // Assert - logs should be written to custom file
      expect(existsSync(customLogFile)).toBe(true);

      // Verify file content
      const fileContent = readFileSync(customLogFile, "utf-8");
      const logEntry = JSON.parse(fileContent.trim()) as Record<string, unknown>;
      expect(logEntry.target_agent).toBe("junior-agent");
      expect(logEntry.matcher_type).toBe("complexity");
    });

    test("console output with debug mode - logs appear in console with debug info", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["debug"],
            mode: "any",
          },
          target_agent: "debug-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "test something",
        projectDir: "/test/project",
      }, logger);

      // Assert - logs should appear in console
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify debug_info is present
      expect(logEntry.debug_info).toBeDefined();
      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(2);
      expect(Array.isArray(debugInfo.all_evaluated)).toBe(true);

      // Verify no file was created for console output
      expect(existsSync("routing.log")).toBe(false);
    });

    test("file output with debug mode - logs written to file with debug info", () => {
      // Arrange
      const logFile = join(tempDir, "e2e-debug.log");
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "always",
          },
          target_agent: "default-agent",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "any prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert - logs should be in file with debug info
      expect(existsSync(logFile)).toBe(true);

      const fileContent = readFileSync(logFile, "utf-8");
      const logEntry = JSON.parse(fileContent.trim()) as Record<string, unknown>;

      // Verify debug_info is present in file
      expect(logEntry.debug_info).toBeDefined();
      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(2);
      expect(Array.isArray(debugInfo.all_evaluated)).toBe(true);

      // Verify console output is empty for file output
      expect(logOutput.length).toBe(0);
    });
  });

  describe("E2E: Verify debug mode provides additional context", () => {
    test("debug mode includes all evaluated matchers in log", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["bug", "fix"],
            mode: "any",
          },
          target_agent: "debug-agent",
        },
        {
          matcher: {
            type: "regex",
            pattern: "^(add|create)",
            flags: "i",
          },
          target_agent: "create-agent",
        },
        {
          matcher: {
            type: "complexity",
            threshold: "high",
          },
          target_agent: "senior-agent",
        },
        {
          matcher: { type: "always" },
          target_agent: "default-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "This is a test prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      // Verify debug_info is present
      expect(logEntry.debug_info).toBeDefined();
      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(4);

      // Verify all evaluated matchers are included
      expect(Array.isArray(debugInfo.all_evaluated)).toBe(true);
      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(4);

      // Verify all matcher types are present
      const matcherTypes = allEvaluated.map((e) => (e as Record<string, unknown>).matcher_type as string);
      expect(matcherTypes).toContain("keyword");
      expect(matcherTypes).toContain("regex");
      expect(matcherTypes).toContain("complexity");
      expect(matcherTypes).toContain("always");
    });

    test("debug mode clearly marks non-matching matchers with matched: false", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["deploy", "production"],
            mode: "any",
          },
          target_agent: "deploy-agent",
        },
        {
          matcher: {
            type: "regex",
            pattern: "\\b(API|api)\\b",
            flags: "i",
          },
          target_agent: "api-agent",
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["test"],
            mode: "any",
          },
          target_agent: "test-agent",
        },
      ];

      // Act - "write unit tests" will match the third rule
      evaluateRoutingRules(rules, {
        prompt: "Write unit tests for the authentication module",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];

      // Verify the first two matchers are clearly marked as not matched
      expect(allEvaluated[0] as Record<string, unknown>).toMatchObject({
        matcher_type: "keyword",
        matched: false,
      });
      expect(allEvaluated[1] as Record<string, unknown>).toMatchObject({
        matcher_type: "regex",
        matched: false,
      });

      // Verify the matching matcher is marked as matched
      expect(allEvaluated[2] as Record<string, unknown>).toMatchObject({
        matcher_type: "keyword",
        matched: true,
      });
    });

    test("debug mode with file output includes all evaluated matchers", () => {
      // Arrange
      const logFile = join(tempDir, "e2e-debug-eval.log");
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "file",
        log_file: logFile,
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["bug"],
            mode: "any",
          },
          target_agent: "bug-agent",
        },
        {
          matcher: { type: "always" },
          target_agent: "default-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Add a new feature",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(existsSync(logFile)).toBe(true);
      const fileContent = readFileSync(logFile, "utf-8");
      const logEntry = JSON.parse(fileContent.trim()) as Record<string, unknown>;

      // Verify debug_info includes all evaluations
      expect(logEntry.debug_info).toBeDefined();
      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBe(2);
      expect(Array.isArray(debugInfo.all_evaluated)).toBe(true);

      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(2);

      // Verify matcher objects are included
      const firstEval = allEvaluated[0] as Record<string, unknown>;
      expect(firstEval.matcher_type).toBe("keyword");
      expect(firstEval.matched).toBe(false);
      expect(firstEval.matcher).toBeDefined();

      const secondEval = allEvaluated[1] as Record<string, unknown>;
      expect(secondEval.matcher_type).toBe("always");
      expect(secondEval.matched).toBe(true);
      expect(secondEval.matcher).toBeDefined();
    });

    test("debug mode with mixed matched and non-matching clearly distinguishes", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: {
            type: "keyword",
            keywords: ["low", "simple"],
            mode: "any",
          },
          target_agent: "junior-agent",
        },
        {
          matcher: {
            type: "complexity",
            threshold: "high",
          },
          target_agent: "senior-agent",
        },
        {
          matcher: { type: "always" },
          target_agent: "default-agent",
        },
      ];

      // Complex prompt that should trigger complexity matcher
      const complexPrompt = `
Design a comprehensive system architecture involving:
- High-performance database integration
- Concurrency and async handling patterns
- Security and encryption implementation
- API integration strategies
      `.trim();

      // Act
      evaluateRoutingRules(rules, {
        prompt: complexPrompt,
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];

      // Verify non-matching matchers are clearly marked
      const firstEval = allEvaluated[0] as Record<string, unknown>;
      expect(firstEval.matcher_type).toBe("keyword");
      expect(firstEval.matched).toBe(false);

      // Verify the matching matcher is clearly marked
      const secondEval = allEvaluated[1] as Record<string, unknown>;
      expect(secondEval.matcher_type).toBe("complexity");
      expect(secondEval.matched).toBe(true);
      expect(secondEval.matcher).toBeDefined();

      // Verify matcher properties are preserved
      const matcher = secondEval.matcher as Record<string, unknown>;
      expect(matcher.type).toBe("complexity");
      expect(matcher.threshold).toBe("high");
    });

    test("debug mode total_evaluated matches all_evaluated length", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: true,
        output: "console",
        debug_mode: true,
      };
      const logger = new RoutingLogger(loggerConfig);

      const rules: RoutingRule[] = [
        {
          matcher: { type: "always" },
          target_agent: "default-agent",
        },
      ];

      // Act
      evaluateRoutingRules(rules, {
        prompt: "Any prompt",
        projectDir: "/test/project",
      }, logger);

      // Assert
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[0]!) as Record<string, unknown>;

      const debugInfo = logEntry.debug_info as Record<string, unknown>;
      expect(debugInfo.total_evaluated).toBeDefined();
      expect(typeof debugInfo.total_evaluated).toBe("number");
      expect(debugInfo.total_evaluated).toBe(1);

      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(debugInfo.total_evaluated as number);
    });
  });
});
