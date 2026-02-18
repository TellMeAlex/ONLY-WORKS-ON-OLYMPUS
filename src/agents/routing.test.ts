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
import type { RoutingLoggerConfig } from "../config/schema.js";

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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      expect(parsed.matched_content).toBe(specialContent);
    });

    test("console output with all matcher types", () => {
      // Arrange
      const logger = new RoutingLogger({ output: "console" });

      // Act - test all matcher types
      const matcherTypes = ["keyword", "regex", "complexity", "project_context", "always"];
      matcherTypes.forEach((type) => {
        logOutput = []; // Reset for each call
        logger.logRoutingDecision(`agent-${type}`, type, `matched: ${type}`);
        expect(logOutput.length).toBe(1);
        const logLine = logOutput[0];
        const parsed = JSON.parse(logLine) as Record<string, unknown>;
        expect(parsed.matcher_type).toBe(type);
      });
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
          matcher: { type: "keyword", keywords: ["test"] },
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
          matcher: { type: "keyword", keywords: ["test"] },
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
      const logLine = logOutput[0];
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
          matcher: { type: "keyword", keywords: ["test"] },
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
          matcher: { type: "keyword", keywords: ["api", "test"] },
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
      const logLine = logOutput[0];
      const parsed = JSON.parse(logLine) as Record<string, unknown>;

      const debugInfo = parsed.debug_info as Record<string, unknown>;
      const allEvaluated = debugInfo.all_evaluated as unknown[];
      expect(allEvaluated.length).toBe(1);

      const firstEval = allEvaluated[0] as Record<string, unknown>;
      expect(firstEval.matcher_type).toBe("keyword");
      expect(firstEval.matched).toBe(true);
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
          matcher: { type: "keyword", keywords: ["test"] },
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
          matcher: { type: "keyword", keywords: ["test"] },
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
      matcherTypes.forEach((type) => {
        logger.logRoutingDecision(`agent-${type}`, type, `matched: ${type}`);
      });

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
        output: "unknown" as const,
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
      const logLine = logOutput[0];
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
      const logLine = logOutput[0];
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
          matcher: { type: "keyword", keywords: ["a"] },
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
      const logLine = logOutput[0];
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
          matcher: { type: "keyword", keywords: ["api"] },
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
      const logLine = logOutput[0];
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
      expect(logOutput[0]).toContain("agent-console");
      expect(existsSync(logFile)).toBe(true);

      const fileContent = readFileSync(logFile, "utf-8");
      expect(fileContent).toContain("agent-file");
      expect(fileContent).not.toContain("agent-console");
    });
  });
});
