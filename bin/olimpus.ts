#!/usr/bin/env bun

/**
 * Olimpus CLI - Command-line interface for Olimpus configuration management
 *
 * Usage:
 *   olimpus validate <config-file>    Validate a configuration file
 *   olimpus validate --help           Show help for validate command
 *   olimpus test <config-file>        Test routing rules
 *   olimpus test --help               Show help for test command
 *   olimpus --help                    Show general help
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "jsonc-parser";
import { OlimpusConfigSchema, type OlimpusConfig } from "../src/config/schema.js";
import {
  validateOlimpusConfig,
  getValidationSummary,
  formatErrors,
  formatWarnings,
} from "../src/config/validator.js";

/**
 * Parsed command options
 */
interface CommandOptions {
  config?: string;
  positional: string[];
  help: boolean;
}

/**
 * CLI command interface
 */
interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => number | Promise<number>;
}

/**
 * Parse command line options
 */
function parseOptions(args: string[]): CommandOptions {
  const options: CommandOptions = {
    positional: [],
    help: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      i++;
    } else if (arg === "--config") {
      i++;
      if (i < args.length) {
        options.config = args[i];
        i++;
      } else {
        throw new Error("Missing value for --config option");
      }
    } else if (arg.startsWith("--config=")) {
      options.config = arg.slice(9);
      i++;
    } else {
      // Positional argument
      options.positional.push(arg);
      i++;
    }
  }

  return options;
}

/**
 * Parse JSONC file content
 */
function parseJsoncFile(filePath: string): unknown {
  const content = fs.readFileSync(filePath, "utf-8");
  const errors: Array<{ error: number; offset: number; length: number }> = [];
  const parsed = parse(content, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => {
        const line = content.substring(0, err.offset).split("\n").length;
        return `  Offset ${err.offset} (line ${line}): error code ${err.error}`;
      })
      .join("\n");
    throw new Error(`JSONC parse error in ${filePath}:\n${errorMessages}`);
  }

  return parsed;
}

/**
 * Load and parse configuration from a JSONC file
 */
function loadConfig(filePath: string): OlimpusConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found: ${filePath}`);
  }

  const data = parseJsoncFile(filePath);
  const result = OlimpusConfigSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join(".")} - ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid olimpus config:\n${errors}`);
  }

  return result.data;
}

/**
 * Validate command handler
 */
async function validateCommand(args: string[]): Promise<number> {
  const options = parseOptions(args);

  // Show help if requested
  if (options.help || (options.positional.length === 0 && !options.config)) {
    showValidateHelp();
    return 0;
  }

  try {
    // Get config file path from --config option or positional argument
    let filePath: string;
    if (options.config) {
      filePath = options.config;
    } else if (options.positional.length > 0) {
      filePath = options.positional[0];
    } else {
      throw new Error("Configuration file path is required. Use --config <file> or provide as positional argument.");
    }

    // Load configuration
    const config = loadConfig(filePath);
    const absolutePath = path.resolve(filePath);

    // Validate configuration
    const result = validateOlimpusConfig(config, {
      configPath: absolutePath,
      configName: path.basename(filePath),
    });

    // Print results
    console.log(`\n📋 Validating: ${filePath}\n`);

    if (result.valid) {
      console.log("✅ " + getValidationSummary(result));
    } else {
      console.log("❌ " + getValidationSummary(result));
    }

    // Print errors if any
    if (result.errors.length > 0) {
      console.log("\nErrors:");
      formatErrors(result).forEach((error) => console.log(`  ${error}`));
    }

    // Print warnings if any
    if (result.warnings.length > 0) {
      console.log("\nWarnings:");
      formatWarnings(result).forEach((warning) => console.log(`  ${warning}`));
    }

    console.log();

    return result.valid ? 0 : 1;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    } else {
      console.error(`\n❌ Unexpected error\n`);
    }
    return 1;
  }
}

/**
 * Show validate command help
 */
function showValidateHelp(): void {
  console.log(`
Usage: olimpus validate [options] [<config-file>]

Validate a configuration file for errors, circular dependencies, invalid agent references, and other common issues.

Arguments:
  <config-file>    Path to the configuration file to validate (e.g., olimpus.jsonc)
                  If --config is provided, this argument is ignored.

Options:
  --config <file>  Path to the configuration file (alternative to positional argument)
  -h, --help       Show this help message

Examples:
  olimpus validate olimpus.jsonc
  olimpus validate --config ./example/olimpus.jsonc
  olimpus validate --config=/path/to/config.jsonc

Exit codes:
  0                Configuration is valid
  1                Configuration has errors or validation failed
`);
}

/**
 * Test command handler
 */
async function testCommand(args: string[]): Promise<number> {
  const options = parseOptions(args);

  // Show help if requested
  if (options.help || (options.positional.length === 0 && !options.config)) {
    showTestHelp();
    return 0;
  }

  try {
    // Get config file path from --config option or positional argument
    let filePath: string;
    if (options.config) {
      filePath = options.config;
    } else if (options.positional.length > 0) {
      filePath = options.positional[0];
    } else {
      throw new Error("Configuration file path is required. Use --config <file> or provide as positional argument.");
    }

    // Load configuration
    const config = loadConfig(filePath);
    const absolutePath = path.resolve(filePath);

    console.log(`\n🧪 Testing routing rules: ${filePath}\n`);

    // TODO: Implement routing rule testing logic in subsequent subtasks
    console.log("⚠️  Testing functionality will be implemented in upcoming subtasks.");
    console.log();

    return 0;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    } else {
      console.error(`\n❌ Unexpected error\n`);
    }
    return 1;
  }
}

/**
 * Show test command help
 */
function showTestHelp(): void {
  console.log(`
Usage: olimpus test [options] [<config-file>]

Test routing rules to verify they match the expected behavior for various user queries.

Arguments:
  <config-file>    Path to the configuration file to test (e.g., olimpus.jsonc)
                  If --config is provided, this argument is treated as the test query.

Options:
  --config <file>  Path to the configuration file (alternative to positional argument)
  -h, --help       Show this help message

Examples:
  olimpus test olimpus.jsonc
  olimpus test --config ./example/olimpus.jsonc
  olimpus test --config=/path/to/config.jsonc

Exit codes:
  0                All tests passed
  1                Tests failed or testing encountered an error
`);
}

/**
 * Show general help
 */
function showHelp(): void {
  console.log(`
Olimpus CLI - Configuration management tool for Olimpus meta-agent orchestrator

Usage: olimpus <command> [options]

Commands:
  validate          Validate configuration file
  test              Test routing rules

Options:
  -h, --help       Show this help message

Examples:
  olimpus validate olimpus.jsonc
  olimpus test olimpus.jsonc
  olimpus validate --help

For more information on a specific command, run:
  olimpus <command> --help
`);
}

/**
 * Main CLI entry point
 */
async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    return 0;
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  const commands: Record<string, Command> = {
    validate: {
      name: "validate",
      description: "Validate a configuration file",
      execute: validateCommand,
    },
    test: {
      name: "test",
      description: "Test routing rules",
      execute: testCommand,
    },
  };

  const command = commands[commandName];

  if (!command) {
    console.error(`\n❌ Unknown command: ${commandName}\n`);
    console.log("Run 'olimpus --help' for available commands.\n");
    return 1;
  }

  return await command.execute(commandArgs);
}

// Run CLI if this file is executed directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const exitCode = await main();
  process.exit(exitCode);
}
