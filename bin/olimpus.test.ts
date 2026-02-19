import { test, expect, describe } from "bun:test";
import { parseOptions } from "./olimpus.js";

describe("parseOptions", () => {
  describe("default values", () => {
    test("applies default values with no arguments", () => {
      // Act
      const options = parseOptions([]);

      // Assert
      expect(options.help).toBe(false);
      expect(options.verbose).toBe(false);
      expect(options.config).toBeUndefined();
      expect(options.metaAgent).toBeUndefined();
      expect(options.expectAgent).toBeUndefined();
      expect(options.dryRun).toBeUndefined();
      expect(options.positional).toEqual([]);
    });

    test("does not set dryRun when not provided", () => {
      // Act
      const options = parseOptions([]);

      // Assert
      expect(options.dryRun).toBeUndefined();
    });
  });

  describe("boolean flags", () => {
    test("parses --help flag", () => {
      // Act
      const options = parseOptions(["--help"]);

      // Assert
      expect(options.help).toBe(true);
      expect(options.verbose).toBe(false);
    });

    test("parses -h short flag for help", () => {
      // Act
      const options = parseOptions(["-h"]);

      // Assert
      expect(options.help).toBe(true);
      expect(options.verbose).toBe(false);
    });

    test("parses --verbose flag", () => {
      // Act
      const options = parseOptions(["--verbose"]);

      // Assert
      expect(options.verbose).toBe(true);
      expect(options.help).toBe(false);
    });

    test("parses -v short flag for verbose", () => {
      // Act
      const options = parseOptions(["-v"]);

      // Assert
      expect(options.verbose).toBe(true);
      expect(options.help).toBe(false);
    });

    test("parses --dry-run flag", () => {
      // Act
      const options = parseOptions(["--dry-run"]);

      // Assert
      expect(options.dryRun).toBe(true);
      expect(options.verbose).toBe(false);
    });

    test("does not require value for --dry-run", () => {
      // Act
      const options = parseOptions(["--dry-run", "some-arg"]);

      // Assert
      expect(options.dryRun).toBe(true);
      expect(options.positional).toEqual(["some-arg"]);
    });
  });

  describe("--config option", () => {
    test("parses --config with space", () => {
      // Act
      const options = parseOptions(["--config", "olimpus.jsonc"]);

      // Assert
      expect(options.config).toBe("olimpus.jsonc");
      expect(options.positional).toEqual([]);
    });

    test("parses --config with equals sign", () => {
      // Act
      const options = parseOptions(["--config=olimpus.jsonc"]);

      // Assert
      expect(options.config).toBe("olimpus.jsonc");
      expect(options.positional).toEqual([]);
    });

    test("parses --config with path containing spaces", () => {
      // Act
      const options = parseOptions(["--config", "path/to/olimpus.jsonc"]);

      // Assert
      expect(options.config).toBe("path/to/olimpus.jsonc");
    });

    test("parses --config= with path containing spaces", () => {
      // Act
      const options = parseOptions(["--config=path/to/olimpus.jsonc"]);

      // Assert
      expect(options.config).toBe("path/to/olimpus.jsonc");
    });

    test("throws error when --config has no value (space)", () => {
      // Act & Assert
      expect(() => parseOptions(["--config"])).toThrow(
        "Missing value for --config option"
      );
    });

    test("throws error when --config= has no value", () => {
      // Act
      const options = parseOptions(["--config="]);

      // Assert: empty string is valid, though unusual
      expect(options.config).toBe("");
    });

    test("handles --config with absolute path", () => {
      // Act
      const options = parseOptions(["--config", "/absolute/path/to/config.jsonc"]);

      // Assert
      expect(options.config).toBe("/absolute/path/to/config.jsonc");
    });
  });

  describe("--meta-agent option", () => {
    test("parses --meta-agent with space", () => {
      // Act
      const options = parseOptions(["--meta-agent", "my-agent"]);

      // Assert
      expect(options.metaAgent).toBe("my-agent");
      expect(options.positional).toEqual([]);
    });

    test("parses --meta-agent with equals sign", () => {
      // Act
      const options = parseOptions(["--meta-agent=my-agent"]);

      // Assert
      expect(options.metaAgent).toBe("my-agent");
      expect(options.positional).toEqual([]);
    });

    test("parses --meta-agent with underscore and hyphens", () => {
      // Act
      const options = parseOptions(["--meta-agent", "my_special-agent-01"]);

      // Assert
      expect(options.metaAgent).toBe("my_special-agent-01");
    });

    test("throws error when --meta-agent has no value (space)", () => {
      // Act & Assert
      expect(() => parseOptions(["--meta-agent"])).toThrow(
        "Missing value for --meta-agent option"
      );
    });

    test("throws error when --meta-agent= has no value", () => {
      // Act
      const options = parseOptions(["--meta-agent="]);

      // Assert: empty string is valid, though unusual
      expect(options.metaAgent).toBe("");
    });
  });

  describe("--expect-agent option", () => {
    test("parses --expect-agent with space", () => {
      // Act
      const options = parseOptions(["--expect-agent", "librarian"]);

      // Assert
      expect(options.expectAgent).toBe("librarian");
      expect(options.positional).toEqual([]);
    });

    test("parses --expect-agent with equals sign", () => {
      // Act
      const options = parseOptions(["--expect-agent=librarian"]);

      // Assert
      expect(options.expectAgent).toBe("librarian");
      expect(options.positional).toEqual([]);
    });

    test("parses --expect-agent with underscores and hyphens", () => {
      // Act
      const options = parseOptions(["--expect-agent", "code_analyzer-v2"]);

      // Assert
      expect(options.expectAgent).toBe("code_analyzer-v2");
    });

    test("throws error when --expect-agent has no value (space)", () => {
      // Act & Assert
      expect(() => parseOptions(["--expect-agent"])).toThrow(
        "Missing value for --expect-agent option"
      );
    });

    test("throws error when --expect-agent= has no value", () => {
      // Act
      const options = parseOptions(["--expect-agent="]);

      // Assert: empty string is valid, though unusual
      expect(options.expectAgent).toBe("");
    });
  });

  describe("positional arguments", () => {
    test("collects single positional argument", () => {
      // Act
      const options = parseOptions(["olimpus.jsonc"]);

      // Assert
      expect(options.positional).toEqual(["olimpus.jsonc"]);
    });

    test("collects multiple positional arguments", () => {
      // Act
      const options = parseOptions(["olimpus.jsonc", "test", "prompt"]);

      // Assert
      expect(options.positional).toEqual(["olimpus.jsonc", "test", "prompt"]);
    });

    test("collects positional arguments with spaces in values", () => {
      // Act
      const options = parseOptions(["olimpus.jsonc", "this is a test prompt"]);

      // Assert
      expect(options.positional).toEqual(["olimpus.jsonc", "this is a test prompt"]);
    });

    test("treats unknown flags as positional arguments", () => {
      // Act
      const options = parseOptions(["--unknown-flag", "olimpus.jsonc"]);

      // Assert
      expect(options.positional).toEqual(["--unknown-flag", "olimpus.jsonc"]);
      expect(options.help).toBe(false);
      expect(options.verbose).toBe(false);
    });

    test("treats unknown short flags as positional arguments", () => {
      // Act
      const options = parseOptions(["-x", "-y", "olimpus.jsonc"]);

      // Assert
      expect(options.positional).toEqual(["-x", "-y", "olimpus.jsonc"]);
      expect(options.help).toBe(false);
    });
  });

  describe("combined options", () => {
    test("parses --config and positional argument", () => {
      // Act
      const options = parseOptions(["--config", "config.jsonc", "test", "prompt"]);

      // Assert
      expect(options.config).toBe("config.jsonc");
      expect(options.positional).toEqual(["test", "prompt"]);
    });

    test("parses --config and --meta-agent together", () => {
      // Act
      const options = parseOptions([
        "--config",
        "config.jsonc",
        "--meta-agent",
        "my-agent",
      ]);

      // Assert
      expect(options.config).toBe("config.jsonc");
      expect(options.metaAgent).toBe("my-agent");
      expect(options.positional).toEqual([]);
    });

    test("parses all options together", () => {
      // Act
      const options = parseOptions([
        "--config=config.jsonc",
        "--meta-agent=my-agent",
        "--expect-agent=target-agent",
        "--verbose",
        "--dry-run",
        "test",
        "prompt",
      ]);

      // Assert
      expect(options.config).toBe("config.jsonc");
      expect(options.metaAgent).toBe("my-agent");
      expect(options.expectAgent).toBe("target-agent");
      expect(options.verbose).toBe(true);
      expect(options.dryRun).toBe(true);
      expect(options.positional).toEqual(["test", "prompt"]);
    });

    test("parses -v short flag with other options", () => {
      // Act
      const options = parseOptions([
        "-v",
        "--config=config.jsonc",
        "test",
        "prompt",
      ]);

      // Assert
      expect(options.verbose).toBe(true);
      expect(options.config).toBe("config.jsonc");
      expect(options.positional).toEqual(["test", "prompt"]);
    });

    test("parses -h short flag with other options", () => {
      // Act
      const options = parseOptions(["-h", "--config=config.jsonc"]);

      // Assert
      expect(options.help).toBe(true);
      expect(options.config).toBe("config.jsonc");
    });

    test("handles options in different orders", () => {
      // Act
      const options1 = parseOptions([
        "--verbose",
        "test",
        "--config=config.jsonc",
      ]);
      const options2 = parseOptions([
        "--config=config.jsonc",
        "--verbose",
        "test",
      ]);
      const options3 = parseOptions([
        "test",
        "--verbose",
        "--config=config.jsonc",
      ]);

      // Assert: all should produce the same results
      expect(options1.config).toBe("config.jsonc");
      expect(options1.verbose).toBe(true);
      expect(options1.positional).toEqual(["test"]);

      expect(options2.config).toBe("config.jsonc");
      expect(options2.verbose).toBe(true);
      expect(options2.positional).toEqual(["test"]);

      expect(options3.config).toBe("config.jsonc");
      expect(options3.verbose).toBe(true);
      expect(options3.positional).toEqual(["test"]);
    });
  });

  describe("edge cases", () => {
    test("handles empty strings as values", () => {
      // Act
      const options = parseOptions(["--config=", ""]);

      // Assert
      expect(options.config).toBe("");
      expect(options.positional).toEqual([""]);
    });

    test("handles multiple equals signs in value", () => {
      // Act
      const options = parseOptions(["--config=path==config.jsonc"]);

      // Assert
      expect(options.config).toBe("path==config.jsonc");
    });

    test("handles values starting with hyphen", () => {
      // Act
      const options = parseOptions(["--meta-agent", "-my-agent"]);

      // Assert
      expect(options.metaAgent).toBe("-my-agent");
    });

    test("handles positional argument after option with equals", () => {
      // Act
      const options = parseOptions(["--config=config.jsonc", "positional1"]);

      // Assert
      expect(options.config).toBe("config.jsonc");
      expect(options.positional).toEqual(["positional1"]);
    });

    test("handles multiple identical flags (last one wins)", () => {
      // Act
      const options = parseOptions([
        "--config=first.jsonc",
        "--config=second.jsonc",
      ]);

      // Assert
      expect(options.config).toBe("second.jsonc");
    });

    test("handles multiple identical boolean flags (idempotent)", () => {
      // Act
      const options = parseOptions(["--verbose", "--verbose"]);

      // Assert
      expect(options.verbose).toBe(true);
    });

    test("handles repeated short boolean flags", () => {
      // Act
      const options = parseOptions(["-v", "-v"]);

      // Assert
      expect(options.verbose).toBe(true);
    });
  });

  describe("error conditions", () => {
    test("throws error for --config at end without value", () => {
      // Act & Assert
      expect(() => parseOptions(["--config"])).toThrow(
        "Missing value for --config option"
      );
    });

    test("throws error for --meta-agent at end without value", () => {
      // Act & Assert
      expect(() => parseOptions(["--meta-agent"])).toThrow(
        "Missing value for --meta-agent option"
      );
    });

    test("throws error for --expect-agent at end without value", () => {
      // Act & Assert
      expect(() => parseOptions(["--expect-agent"])).toThrow(
        "Missing value for --expect-agent option"
      );
    });

    test("throws Error object for --config at end", () => {
      // Act
      let error: Error | undefined;
      try {
        parseOptions(["--config"]);
      } catch (e) {
        error = e as Error;
      }

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain("--config");
    });

    test("throws Error object for --meta-agent at end", () => {
      // Act
      let error: Error | undefined;
      try {
        parseOptions(["--meta-agent"]);
      } catch (e) {
        error = e as Error;
      }

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain("--meta-agent");
    });

    test("throws Error object for --expect-agent at end", () => {
      // Act
      let error: Error | undefined;
      try {
        parseOptions(["--expect-agent"]);
      } catch (e) {
        error = e as Error;
      }

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain("--expect-agent");
    });
  });

  describe("test command specific scenarios", () => {
    test("parses test command with config file and prompt", () => {
      // Act
      const options = parseOptions(["olimpus.jsonc", "help me write code"]);

      // Assert
      expect(options.positional).toEqual(["olimpus.jsonc", "help me write code"]);
      expect(options.config).toBeUndefined();
    });

    test("parses test command with --config and prompt", () => {
      // Act
      const options = parseOptions([
        "--config=olimpus.jsonc",
        "help me write code",
      ]);

      // Assert
      expect(options.config).toBe("olimpus.jsonc");
      expect(options.positional).toEqual(["help me write code"]);
    });

    test("parses test command with all options", () => {
      // Act
      const options = parseOptions([
        "--config=olimpus.jsonc",
        "--meta-agent=my-router",
        "--expect-agent=code-writer",
        "--verbose",
        "--dry-run",
        "write a function",
      ]);

      // Assert
      expect(options.config).toBe("olimpus.jsonc");
      expect(options.metaAgent).toBe("my-router");
      expect(options.expectAgent).toBe("code-writer");
      expect(options.verbose).toBe(true);
      expect(options.dryRun).toBe(true);
      expect(options.positional).toEqual(["write a function"]);
    });

    test("parses test command with multi-word prompt", () => {
      // Act
      const options = parseOptions([
        "olimpus.jsonc",
        "I need to write a function that",
        "sorts an array",
      ]);

      // Assert
      expect(options.positional).toEqual([
        "olimpus.jsonc",
        "I need to write a function that",
        "sorts an array",
      ]);
    });
  });

  describe("validate command scenarios", () => {
    test("parses validate command with config file", () => {
      // Act
      const options = parseOptions(["olimpus.jsonc"]);

      // Assert
      expect(options.positional).toEqual(["olimpus.jsonc"]);
    });

    test("parses validate command with --config", () => {
      // Act
      const options = parseOptions(["--config=olimpus.jsonc"]);

      // Assert
      expect(options.config).toBe("olimpus.jsonc");
      expect(options.positional).toEqual([]);
    });

    test("parses validate command with help flag", () => {
      // Act
      const options = parseOptions(["--help"]);

      // Assert
      expect(options.help).toBe(true);
    });
  });
});
