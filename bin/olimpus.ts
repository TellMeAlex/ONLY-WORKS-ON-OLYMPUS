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
import {
  evaluateRoutingRules,
  type RoutingContext,
  type ResolvedRoute,
  type RoutingResult,
  type MatcherEvaluation,
} from "../src/agents/routing.js";
import { success, warning, error as errorColor, info, bold, dim } from "../src/utils/colors.js";

/**
 * Parsed command options
 */
interface CommandOptions {
  config?: string;
  metaAgent?: string;
  positional: string[];
  help: boolean;
  verbose: boolean;
  dryRun?: boolean;
  expectAgent?: string;
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
 * @export for testing
 */
export function parseOptions(args: string[]): CommandOptions {
  const options: CommandOptions = {
    positional: [],
    help: false,
    verbose: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      i++;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
      i++;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
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
    } else if (arg === "--meta-agent") {
      i++;
      if (i < args.length) {
        options.metaAgent = args[i];
        i++;
      } else {
        throw new Error("Missing value for --meta-agent option");
      }
    } else if (arg.startsWith("--meta-agent=")) {
      options.metaAgent = arg.slice(13);
      i++;
    } else if (arg === "--expect-agent") {
      i++;
      if (i < args.length) {
        options.expectAgent = args[i];
        i++;
      } else {
        throw new Error("Missing value for --expect-agent option");
      }
    } else if (arg.startsWith("--expect-agent=")) {
      options.expectAgent = arg.slice(15);
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
 * Result of scanning project context
 */
interface ProjectContextResult {
  projectFiles: string[];
  projectDeps: string[];
}

/**
 * Scan project directory for files and dependencies
 *
 * @param projectDir - The root directory of the project to scan
 * @returns Object containing arrays of file paths and dependency names
 */
function scanProjectContext(projectDir: string): ProjectContextResult {
  const projectFiles: string[] = [];
  const projectDeps: string[] = [];

  // Scan for files recursively, excluding common ignore directories
  const ignoreDirs = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    ".turbo",
    ".cache",
    ".idea",
    ".vscode",
  ]);

  function scanDir(dir: string, relativePath: string = ""): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryName = entry.name;
        const entryPath = path.join(dir, entryName);
        const entryRelativePath = relativePath
          ? path.join(relativePath, entryName)
          : entryName;

        if (entry.isDirectory()) {
          if (ignoreDirs.has(entryName)) {
            continue;
          }
          scanDir(entryPath, entryRelativePath);
        } else if (entry.isFile()) {
          projectFiles.push(entryRelativePath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scanDir(projectDir);

  // Scan for dependencies in package.json
  const packageJsonPath = path.join(projectDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(packageJsonContent) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };

      if (packageJson.dependencies) {
        projectDeps.push(...Object.keys(packageJson.dependencies));
      }
      if (packageJson.devDependencies) {
        projectDeps.push(...Object.keys(packageJson.devDependencies));
      }
      if (packageJson.peerDependencies) {
        projectDeps.push(...Object.keys(packageJson.peerDependencies));
      }
    } catch (error) {
      // Skip package.json parsing errors
    }
  }

  // Sort results for consistent output
  projectFiles.sort();
  projectDeps.sort();

  return { projectFiles, projectDeps };
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
    console.log(`\n${bold("📋 Validating:")} ${filePath}\n`);

    if (result.valid) {
      console.log(success("✅ " + getValidationSummary(result)));
    } else {
      console.log(errorColor("❌ " + getValidationSummary(result)));
    }

    // Print errors if any
    if (result.errors.length > 0) {
      console.log(`\n${errorColor(bold("Errors:"))}`);
      formatErrors(result).forEach((errorMsg) => console.log(`  ${errorColor(errorMsg)}`));
    }

    // Print warnings if any
    if (result.warnings.length > 0) {
      console.log(`\n${warning(bold("Warnings:"))}`);
      formatWarnings(result).forEach((warningMsg) => console.log(`  ${warning(warningMsg)}`));
    }

    console.log();

    return result.valid ? 0 : 1;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n${errorColor("❌ Error:")} ${dim(error.message)}\n`);
    } else {
      console.error(`\n${errorColor("❌ Unexpected error")}\n`);
    }
    return 1;
  }
}

/**
 * Show validate command help
 */
function showValidateHelp(): void {
  console.log(``);
  console.log(`${bold("Usage:")}`);
  console.log(`  olimpus validate [options] [<config-file>]\n`);
  console.log(`${bold("Description:")}`);
  console.log(`  Validate a configuration file for errors, circular dependencies,`);
  console.log(`  invalid agent references, and other common issues.\n`);
  console.log(`${bold("Arguments:")}`);
  console.log(`  ${dim("<config-file>")}${dim("    ".repeat(14))} Path to the configuration file to validate`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} (e.g., olimpus.jsonc)`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} If --config is provided, this argument is ignored.\n`);
  console.log(`${bold("Options:")}`);
  console.log(`  ${dim("--config <file>")}${dim("  ".repeat(10))} Path to the configuration file`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} (alternative to positional argument)`);
  console.log(`  ${dim("-h, --help")}${dim("       ".repeat(10))} Show this help message\n`);
  console.log(`${bold("Examples:")}`);
  console.log(`  ${dim("olimpus validate olimpus.jsonc")}`);
  console.log(`  ${dim("olimpus validate --config ./example/olimpus.jsonc")}`);
  console.log(`  ${dim("olimpus validate --config=/path/to/config.jsonc")}\n`);
  console.log(`${bold("Exit codes:")}`);
  console.log(`  ${dim("0")} ${dim(" ".repeat(15))} Configuration is valid`);
  console.log(`  ${dim("1")} ${dim(" ".repeat(15))} Configuration has errors or validation failed\n`);
  console.log(`${dim("─".repeat(56))}\n`);
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

    console.log(`\n${bold(info("🧪 Testing routing rules:"))} ${dim(filePath)}\n`);

    // Get project directory from config file location
    const projectDir = path.dirname(absolutePath);

    // Scan project context
    const { projectFiles, projectDeps } = scanProjectContext(projectDir);

    if (options.verbose) {
      console.log(`${info("📁 Project directory:")} ${dim(projectDir)}`);
      console.log(`${info("📄 Found")} ${bold(String(projectFiles.length))} ${info("files")}`);
      console.log(`${info("📦 Found")} ${bold(String(projectDeps.length))} ${info("dependencies")}`);
      console.log();

      if (projectFiles.length > 0) {
        console.log(`${info("📄 projectFiles:")}`);
        for (const file of projectFiles.slice(0, 20)) {
          console.log(`   ${dim("-")} ${dim(file)}`);
        }
        if (projectFiles.length > 20) {
          console.log(`   ${dim(`... and ${projectFiles.length - 20} more files`)}`);
        }
        console.log();
      }

      if (projectDeps.length > 0) {
        console.log(`${info("📦 projectDeps:")}`);
        for (const dep of projectDeps.slice(0, 20)) {
          console.log(`   ${dim("-")} ${dim(dep)}`);
        }
        if (projectDeps.length > 20) {
          console.log(`   ${dim(`... and ${projectDeps.length - 20} more dependencies`)}`);
        }
        console.log();
      }
    }

    // Determine meta-agent ID
    let metaAgentId: string | undefined;
    if (options.metaAgent) {
      metaAgentId = options.metaAgent;
    } else if (config.meta_agents && Object.keys(config.meta_agents).length === 1) {
      // Use the only meta-agent if there's exactly one
      metaAgentId = Object.keys(config.meta_agents)[0];
    } else if (config.meta_agents && Object.keys(config.meta_agents).length > 0) {
      throw new Error(
        "Multiple meta-agents found. Use --meta-agent <agent> to specify which one to test."
      );
    } else {
      throw new Error("No meta-agents found in configuration.");
    }

    // Verify the meta-agent exists
    const metaAgent = config.meta_agents?.[metaAgentId];
    if (!metaAgent) {
      throw new Error(`Meta-agent not found: ${metaAgentId}`);
    }

    // Get test prompt from positional arguments
    let testPrompt: string;
    if (options.positional.length > 0) {
      // If config was passed as --config, positional[0] is the test prompt
      // If config was passed as positional, the remaining args form the test prompt
      const startIndex = options.config ? 0 : 1;
      testPrompt = options.positional.slice(startIndex).join(" ");
    } else {
      throw new Error("Test prompt is required. Provide it as a positional argument after the config file.");
    }

    if (options.verbose) {
      console.log(`${info("🤖 Meta-agent:")} ${bold(metaAgentId)}`);
      console.log(`${info("📝 Test prompt:")} ${dim(testPrompt)}`);
      console.log(`${info("📋 Routing rules:")} ${bold(String(metaAgent.routing_rules.length))}`);
      console.log();
    }

    // Create routing context
    const routingContext: RoutingContext = {
      prompt: testPrompt,
      projectDir,
      projectFiles,
      projectDeps,
    };

    // Evaluate routing rules
    const dryRunResult = options.dryRun
      ? (evaluateRoutingRules(
          metaAgent.routing_rules,
          routingContext,
          undefined,
          true
        ) as RoutingResult)
      : null;

    // Capture evaluations for verbose mode
    const verboseResult = !options.dryRun && options.verbose
      ? (evaluateRoutingRules(
          metaAgent.routing_rules,
          routingContext,
          undefined,
          true
        ) as RoutingResult)
      : null;

    const result: ResolvedRoute | null = dryRunResult
      ? dryRunResult.route
      : verboseResult
        ? verboseResult.route
        : evaluateRoutingRules(metaAgent.routing_rules, routingContext);

    // Display dry-run results (all evaluated matchers)
    if (options.dryRun && dryRunResult) {
      console.log(`${info("🔍 Dry-run mode - showing all evaluated matchers:")}\n`);

      for (const evaluation of dryRunResult.evaluations) {
        const resultPrefix = evaluation.matched ? success("✅") : errorColor("❌");
        const resultText = evaluation.matched ? success("Matched") : errorColor("Not matched");
        console.log(`${resultPrefix} ${info("Evaluating matcher:")} ${bold(evaluation.matcher_type)}`);
        console.log(`   ${dim("Result:")} ${resultText}`);

        // Show matcher details
        switch (evaluation.matcher.type) {
          case "keyword":
            console.log(`   ${dim("Keywords:")} ${dim(evaluation.matcher.keywords.join(", "))}`);
            console.log(`   ${dim("Mode:")} ${dim(evaluation.matcher.mode)}`);
            break;
          case "regex":
            console.log(`   ${dim("Pattern:")} ${dim(`/${evaluation.matcher.pattern}/${evaluation.matcher.flags || ""}`)}`);
            break;
          case "complexity":
            console.log(`   ${dim("Threshold:")} ${dim(String(evaluation.matcher.threshold))}`);
            break;
          case "project_context":
            if (evaluation.matcher.has_files && evaluation.matcher.has_files.length > 0) {
              console.log(`   ${dim("Has files:")} ${dim(evaluation.matcher.has_files.join(", "))}`);
            }
            if (evaluation.matcher.has_deps && evaluation.matcher.has_deps.length > 0) {
              console.log(`   ${dim("Has deps:")} ${dim(evaluation.matcher.has_deps.join(", "))}`);
            }
            break;
          case "always":
            // No details needed for always matcher
            break;
        }

        // Show target agent for each rule
        const rule = metaAgent.routing_rules.find((r) => r.matcher === evaluation.matcher);
        if (rule) {
          console.log(`   ${dim("Target agent:")} ${success(rule.target_agent)}`);
          if (rule.config_overrides) {
            const overrides: string[] = [];
            if (rule.config_overrides.model) overrides.push(`model=${rule.config_overrides.model}`);
            if (rule.config_overrides.temperature !== undefined) {
              overrides.push(`temperature=${rule.config_overrides.temperature}`);
            }
            if (rule.config_overrides.variant) overrides.push(`variant=${rule.config_overrides.variant}`);
            if (overrides.length > 0) {
              console.log(`   ${dim("Overrides:")} ${dim(overrides.join(", "))}`);
            }
          }
        }

        console.log();
      }

      // Show final result
      if (result) {
        console.log(`${success("✅ Final match:")} ${success(result.target_agent)}`);
        console.log(`   ${dim("Matcher type:")} ${info(result.matcher_type || 'unknown')}`);
        console.log(`   ${dim("Matched content:")} ${dim(result.matched_content || 'N/A')}`);
        console.log();

        // Check if the matched agent matches the expected agent
        if (options.expectAgent) {
          if (result.target_agent === options.expectAgent) {
            console.log(`${success("✅ Expected agent matched:")} ${success(options.expectAgent)}`);
            return 0;
          } else {
            console.log(`${errorColor("❌ Expected agent:")} ${errorColor(options.expectAgent)}`);
            console.log(`   ${dim("Actual matched agent:")} ${result.target_agent}`);
            return 2;
          }
        }

        return 0;
      } else {
        console.log(`${errorColor("❌ No matching agent found for the given prompt.")}`);
        console.log();

        if (options.expectAgent) {
          return 2;
        }

        return 2;
      }
    }

    // Display step-by-step evaluation for verbose mode (non-dry-run)
    if (!options.dryRun && options.verbose && verboseResult) {
      console.log(`${info("🔍 Step-by-step evaluation:")}\n`);

      for (const evaluation of verboseResult.evaluations) {
        const resultPrefix = evaluation.matched ? success("✅") : errorColor("❌");
        const resultText = evaluation.matched ? success("Matched") : errorColor("Not matched");
        console.log(`${resultPrefix} ${info(evaluation.matcher_type)} matcher`);
        console.log(`   ${dim("Result:")} ${resultText}`);

        // Show matcher details
        switch (evaluation.matcher.type) {
          case "keyword":
            console.log(`   ${dim("Keywords:")} ${dim(evaluation.matcher.keywords.join(", "))}`);
            console.log(`   ${dim("Mode:")} ${dim(evaluation.matcher.mode)}`);
            break;
          case "regex":
            console.log(`   ${dim("Pattern:")} ${dim(`/${evaluation.matcher.pattern}/${evaluation.matcher.flags || ""}`)}`);
            break;
          case "complexity":
            console.log(`   ${dim("Threshold:")} ${dim(String(evaluation.matcher.threshold))}`);
            break;
          case "project_context":
            if (evaluation.matcher.has_files && evaluation.matcher.has_files.length > 0) {
              console.log(`   ${dim("Has files:")} ${dim(evaluation.matcher.has_files.join(", "))}`);
            }
            if (evaluation.matcher.has_deps && evaluation.matcher.has_deps.length > 0) {
              console.log(`   ${dim("Has deps:")} ${dim(evaluation.matcher.has_deps.join(", "))}`);
            }
            break;
          case "always":
            // No details needed for always matcher
            break;
        }

        // Show target agent for each rule
        const rule = metaAgent.routing_rules.find((r) => r.matcher === evaluation.matcher);
        if (rule) {
          console.log(`   ${dim("Target agent:")} ${success(rule.target_agent)}`);
          if (rule.config_overrides) {
            const overrides: string[] = [];
            if (rule.config_overrides.model) overrides.push(`model=${rule.config_overrides.model}`);
            if (rule.config_overrides.temperature !== undefined) {
              overrides.push(`temperature=${rule.config_overrides.temperature}`);
            }
            if (rule.config_overrides.variant) overrides.push(`variant=${rule.config_overrides.variant}`);
            if (overrides.length > 0) {
              console.log(`   ${dim("Overrides:")} ${dim(overrides.join(", "))}`);
            }
          }
        }

        console.log();
      }
    }

    // Display normal results (non-dry-run)
    if (result) {
      console.log(`${success("✅ Matched agent:")} ${success(result.target_agent)}`);
      console.log(`   ${dim("Matcher type:")} ${info(result.matcher_type || 'unknown')}`);
      console.log(`   ${dim("Matched content:")} ${dim(result.matched_content || 'N/A')}`);

      if (options.verbose) {
        console.log(`   ${dim("Target agent:")} ${success(result.target_agent)}`);
        if (result.config_overrides) {
          const overrides: string[] = [];
          if (result.config_overrides.model) overrides.push(`model=${result.config_overrides.model}`);
          if (result.config_overrides.temperature !== undefined) {
            overrides.push(`temperature=${result.config_overrides.temperature}`);
          }
          if (result.config_overrides.variant) overrides.push(`variant=${result.config_overrides.variant}`);
          if (result.config_overrides.prompt) overrides.push(`prompt=${result.config_overrides.prompt.slice(0, 50)}...`);
          if (overrides.length > 0) {
            console.log(`   ${dim("Overrides:")} ${dim(overrides.join(", "))}`);
          }
        }
      }

      // Check if the matched agent matches the expected agent
      if (options.expectAgent) {
        if (result.target_agent === options.expectAgent) {
          console.log();
          console.log(`${success("✅ Expected agent matched:")} ${success(options.expectAgent)}`);
          return 0;
        } else {
          console.log();
          console.log(`${errorColor("❌ Expected agent:")} ${errorColor(options.expectAgent)}`);
          console.log(`   ${dim("Actual matched agent:")} ${result.target_agent}`);
          return 2;
        }
      }

      console.log();
      return 0;
    } else {
      console.log(`${errorColor("❌ No matching agent found for the given prompt.")}`);
      console.log();

      if (options.expectAgent) {
        return 2;
      }

      return 2;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n${errorColor("❌ Error:")} ${dim(error.message)}\n`);
    } else {
      console.error(`\n${errorColor("❌ Unexpected error")}\n`);
    }
    return 1;
  }
}

/**
 * Show test command help
 */
function showTestHelp(): void {
  console.log(``);
  console.log(`${bold("Usage:")}`);
  console.log(`  olimpus test [options] [<config-file>]\n`);
  console.log(`${bold("Description:")}`);
  console.log(`  Test routing rules to verify they match the expected behavior`);
  console.log(`  for various user queries.\n`);
  console.log(`${bold("Arguments:")}`);
  console.log(`  ${dim("<config-file>")}${dim("    ".repeat(14))} Path to the configuration file to test`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} (e.g., olimpus.jsonc)`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} If --config is provided, this argument is`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} treated as the test query.\n`);
  console.log(`${bold("Options:")}`);
  console.log(`  ${dim("--config <file>")}${dim("  ".repeat(10))} Path to the configuration file`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} (alternative to positional argument)`);
  console.log(`  ${dim("--meta-agent <agent>")}`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} Meta-agent ID to test against`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} (default: the meta-agent specified in config)`);
  console.log(`  ${dim("--verbose, -v")}${dim("    ".repeat(10))} Show detailed output including`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} project context`);
  console.log(`  ${dim("--dry-run")}${dim("        ".repeat(10))} Show all evaluated matchers without`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} selecting one`);
  console.log(`  ${dim("--expect-agent <agent>")}`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} Expected agent ID to match`);
  console.log(`  ${dim("")}${dim(" ".repeat(15))} (exit 2 if not matched, for CI)`);
  console.log(`  ${dim("-h, --help")}${dim("       ".repeat(10))} Show this help message\n`);
  console.log(`${bold("Examples:")}`);
  console.log(`  ${dim("olimpus test olimpus.jsonc")}`);
  console.log(`  ${dim("olimpus test --config ./example/olimpus.jsonc")}`);
  console.log(`  ${dim("olimpus test --config=/path/to/config.jsonc --meta-agent=my-agent")}`);
  console.log(`  ${dim("olimpus test olimpus.jsonc --verbose")}`);
  console.log(`  ${dim("olimpus test olimpus.jsonc --dry-run")}`);
  console.log(`  ${dim("olimpus test olimpus.jsonc --expect-agent librarian")}\n`);
  console.log(`${bold("Exit codes:")}`);
  console.log(`  ${dim("0")} ${dim(" ".repeat(15))} Matched expected agent or all tests passed`);
  console.log(`  ${dim("1")} ${dim(" ".repeat(15))} Error occurred`);
  console.log(`  ${dim("2")} ${dim(" ".repeat(15))} No match or expected agent not matched\n`);
  console.log(`${dim("─".repeat(56))}\n`);
}

/**
 * Show general help
 */
function showHelp(): void {
  console.log(``);
  console.log(`${bold("Olimpus CLI")}`);
  console.log(`${dim("Configuration management tool for Olimpus meta-agent orchestrator")}\n`);
  console.log(`${bold("Usage:")}`);
  console.log(`  olimpus <command> [options]\n`);
  console.log(`${bold("Commands:")}`);
  console.log(`  ${success("validate")}          ${dim("Validate configuration file")}`);
  console.log(`  ${info("test")}              ${dim("Test routing rules")}\n`);
  console.log(`${bold("Options:")}`);
  console.log(`  ${dim("-h, --help")}       ${dim("Show this help message")}\n`);
  console.log(`${bold("Examples:")}`);
  console.log(`  ${dim("olimpus validate olimpus.jsonc")}`);
  console.log(`  ${dim("olimpus test olimpus.jsonc")}`);
  console.log(`  ${dim("olimpus validate --help")}\n`);
  console.log(`${bold("For more information on a specific command, run:")}`);
  console.log(`  ${dim("olimpus <command> --help")}\n`);
  console.log(`${dim("─".repeat(56))}\n`);
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
    console.error(``);
    console.error(`${errorColor("❌ Error:")} ${errorColor(`Unknown command '${commandName}'`)}`);
    console.error(``);
    console.log(`${dim("─".repeat(56))}`);
    console.log(`${bold("Available commands:")}`);
    console.log(`  ${success("validate")}          ${dim("Validate configuration file")}`);
    console.log(`  ${info("test")}              ${dim("Test routing rules")}`);
    console.log(`${dim("─".repeat(56))}`);
    console.log(``);
    console.log(`${info("Run 'olimpus --help' for more information.")}`);
    console.log(``);
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
