#!/usr/bin/env bun

/**
 * Olimpus CLI - Command-line interface for Olimpus configuration management
 *
 * Usage:
 *   olimpus validate <config-file>    Validate a configuration file
 *   olimpus validate --help           Show help for validate command
 *   olimpus test <config-file>        Test routing rules
 *   olimpus test --help               Show help for test command
 *   olimpus templates list             List available templates
 *   olimpus templates list --help      Show help for templates list command
 *   olimpus templates preview <name>   Preview a template
 *   olimpus templates preview --help   Show help for templates preview command
 *   olimpus templates apply <name>    Apply a template to your config
 *   olimpus templates apply --help    Show help for templates apply command
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
import { loadTemplates, type LoadTemplatesOptions } from "../src/templates/loader.js";
import { type Template } from "../src/templates/types.js";

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

    // Get project directory from config file location
    const projectDir = path.dirname(absolutePath);

    // Scan project context
    const { projectFiles, projectDeps } = scanProjectContext(projectDir);

    if (options.verbose) {
      console.log(`📁 Project directory: ${projectDir}`);
      console.log(`📄 Found ${projectFiles.length} files`);
      console.log(`📦 Found ${projectDeps.length} dependencies`);
      console.log();

      if (projectFiles.length > 0) {
        console.log(`📄 projectFiles:`);
        for (const file of projectFiles.slice(0, 20)) {
          console.log(`   - ${file}`);
        }
        if (projectFiles.length > 20) {
          console.log(`   ... and ${projectFiles.length - 20} more files`);
        }
        console.log();
      }

      if (projectDeps.length > 0) {
        console.log(`📦 projectDeps:`);
        for (const dep of projectDeps.slice(0, 20)) {
          console.log(`   - ${dep}`);
        }
        if (projectDeps.length > 20) {
          console.log(`   ... and ${projectDeps.length - 20} more dependencies`);
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
      console.log(`🤖 Meta-agent: ${metaAgentId}`);
      console.log(`📝 Test prompt: ${testPrompt}`);
      console.log(`📋 Routing rules: ${metaAgent.routing_rules.length}`);
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
      console.log(`🔍 Dry-run mode - showing all evaluated matchers:\n`);

      for (const evaluation of dryRunResult.evaluations) {
        const resultPrefix = evaluation.matched ? "✅" : "❌";
        const resultText = evaluation.matched ? "Matched" : "Not matched";
        console.log(`${resultPrefix} Evaluating matcher: ${evaluation.matcher_type}`);
        console.log(`   Result: ${resultText}`);

        // Show matcher details
        switch (evaluation.matcher.type) {
          case "keyword":
            console.log(`   Keywords: ${evaluation.matcher.keywords.join(", ")}`);
            console.log(`   Mode: ${evaluation.matcher.mode}`);
            break;
          case "regex":
            console.log(`   Pattern: /${evaluation.matcher.pattern}/${evaluation.matcher.flags || ""}`);
            break;
          case "complexity":
            console.log(`   Threshold: ${evaluation.matcher.threshold}`);
            break;
          case "project_context":
            if (evaluation.matcher.has_files && evaluation.matcher.has_files.length > 0) {
              console.log(`   Has files: ${evaluation.matcher.has_files.join(", ")}`);
            }
            if (evaluation.matcher.has_deps && evaluation.matcher.has_deps.length > 0) {
              console.log(`   Has deps: ${evaluation.matcher.has_deps.join(", ")}`);
            }
            break;
          case "always":
            // No details needed for always matcher
            break;
        }

        // Show target agent for each rule
        const rule = metaAgent.routing_rules.find((r) => r.matcher === evaluation.matcher);
        if (rule) {
          console.log(`   Target agent: ${rule.target_agent}`);
          if (rule.config_overrides) {
            const overrides: string[] = [];
            if (rule.config_overrides.model) overrides.push(`model=${rule.config_overrides.model}`);
            if (rule.config_overrides.temperature !== undefined) {
              overrides.push(`temperature=${rule.config_overrides.temperature}`);
            }
            if (rule.config_overrides.variant) overrides.push(`variant=${rule.config_overrides.variant}`);
            if (overrides.length > 0) {
              console.log(`   Overrides: ${overrides.join(", ")}`);
            }
          }
        }

        console.log();
      }

      // Show final result
      if (result) {
        console.log(`✅ Final match: ${result.target_agent}`);
        console.log(`   Matcher type: ${result.matcher_type || 'unknown'}`);
        console.log(`   Matched content: ${result.matched_content || 'N/A'}`);
        console.log();

        // Check if the matched agent matches the expected agent
        if (options.expectAgent) {
          if (result.target_agent === options.expectAgent) {
            console.log(`✅ Expected agent matched: ${options.expectAgent}`);
            return 0;
          } else {
            console.log(`❌ Expected agent: ${options.expectAgent}`);
            console.log(`   Actual matched agent: ${result.target_agent}`);
            return 2;
          }
        }

        return 0;
      } else {
        console.log(`❌ No matching agent found for the given prompt.`);
        console.log();

        if (options.expectAgent) {
          return 2;
        }

        return 2;
      }
    }

    // Display step-by-step evaluation for verbose mode (non-dry-run)
    if (!options.dryRun && options.verbose && verboseResult) {
      console.log(`🔍 Step-by-step evaluation:\n`);

      for (const evaluation of verboseResult.evaluations) {
        const resultPrefix = evaluation.matched ? "✅" : "❌";
        const resultText = evaluation.matched ? "Matched" : "Not matched";
        console.log(`${resultPrefix} ${evaluation.matcher_type} matcher`);
        console.log(`   Result: ${resultText}`);

        // Show matcher details
        switch (evaluation.matcher.type) {
          case "keyword":
            console.log(`   Keywords: ${evaluation.matcher.keywords.join(", ")}`);
            console.log(`   Mode: ${evaluation.matcher.mode}`);
            break;
          case "regex":
            console.log(`   Pattern: /${evaluation.matcher.pattern}/${evaluation.matcher.flags || ""}`);
            break;
          case "complexity":
            console.log(`   Threshold: ${evaluation.matcher.threshold}`);
            break;
          case "project_context":
            if (evaluation.matcher.has_files && evaluation.matcher.has_files.length > 0) {
              console.log(`   Has files: ${evaluation.matcher.has_files.join(", ")}`);
            }
            if (evaluation.matcher.has_deps && evaluation.matcher.has_deps.length > 0) {
              console.log(`   Has deps: ${evaluation.matcher.has_deps.join(", ")}`);
            }
            break;
          case "always":
            // No details needed for always matcher
            break;
        }

        // Show target agent for each rule
        const rule = metaAgent.routing_rules.find((r) => r.matcher === evaluation.matcher);
        if (rule) {
          console.log(`   Target agent: ${rule.target_agent}`);
          if (rule.config_overrides) {
            const overrides: string[] = [];
            if (rule.config_overrides.model) overrides.push(`model=${rule.config_overrides.model}`);
            if (rule.config_overrides.temperature !== undefined) {
              overrides.push(`temperature=${rule.config_overrides.temperature}`);
            }
            if (rule.config_overrides.variant) overrides.push(`variant=${rule.config_overrides.variant}`);
            if (overrides.length > 0) {
              console.log(`   Overrides: ${overrides.join(", ")}`);
            }
          }
        }

        console.log();
      }
    }

    // Display normal results (non-dry-run)
    if (result) {
      console.log(`✅ Matched agent: ${result.target_agent}`);
      console.log(`   Matcher type: ${result.matcher_type || 'unknown'}`);
      console.log(`   Matched content: ${result.matched_content || 'N/A'}`);

      if (options.verbose) {
        console.log(`   Target agent: ${result.target_agent}`);
        if (result.config_overrides) {
          const overrides: string[] = [];
          if (result.config_overrides.model) overrides.push(`model=${result.config_overrides.model}`);
          if (result.config_overrides.temperature !== undefined) {
            overrides.push(`temperature=${result.config_overrides.temperature}`);
          }
          if (result.config_overrides.variant) overrides.push(`variant=${result.config_overrides.variant}`);
          if (result.config_overrides.prompt) overrides.push(`prompt=${result.config_overrides.prompt.slice(0, 50)}...`);
          if (overrides.length > 0) {
            console.log(`   Overrides: ${overrides.join(", ")}`);
          }
        }
      }

      // Check if the matched agent matches the expected agent
      if (options.expectAgent) {
        if (result.target_agent === options.expectAgent) {
          console.log();
          console.log(`✅ Expected agent matched: ${options.expectAgent}`);
          return 0;
        } else {
          console.log();
          console.log(`❌ Expected agent: ${options.expectAgent}`);
          console.log(`   Actual matched agent: ${result.target_agent}`);
          return 2;
        }
      }

      console.log();
      return 0;
    } else {
      console.log(`❌ No matching agent found for the given prompt.`);
      console.log();

      if (options.expectAgent) {
        return 2;
      }

      return 2;
    }
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
  --meta-agent <agent>
                  Meta-agent ID to test against (default: the meta-agent specified in config)
  --verbose, -v    Show detailed output including project context
  --dry-run        Show all evaluated matchers without selecting one
  --expect-agent <agent>
                  Expected agent ID to match (exit 2 if not matched, for CI)
  -h, --help       Show this help message

Examples:
  olimpus test olimpus.jsonc
  olimpus test --config ./example/olimpus.jsonc
  olimpus test --config=/path/to/config.jsonc --meta-agent=my-agent
  olimpus test olimpus.jsonc --verbose
  olimpus test olimpus.jsonc --dry-run
  olimpus test olimpus.jsonc --expect-agent librarian

Exit codes:
  0                Matched expected agent or all tests passed
  1                Error occurred
  2                No match or expected agent not matched
`);
}

/**
 * Templates command handler
 */
async function templatesCommand(args: string[]): Promise<number> {
  // Check for subcommand
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showTemplatesHelp();
    return 0;
  }

  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  if (subcommand === "list") {
    return templatesListCommand(subcommandArgs);
  } else if (subcommand === "preview") {
    return templatesPreviewCommand(subcommandArgs);
  } else if (subcommand === "apply") {
    return templatesApplyCommand(subcommandArgs);
  } else {
    console.error(`\n❌ Unknown templates subcommand: ${subcommand}\n`);
    console.log("Run 'olimpus templates --help' for available subcommands.\n");
    return 1;
  }
}

/**
 * Templates list subcommand handler
 */
function templatesListCommand(args: string[]): number {
  const options = parseOptions(args);

  // Show help if requested
  if (options.help) {
    showTemplatesListHelp();
    return 0;
  }

  try {
    const templatesDir = options.config ?? "./templates";
    const loadOptions: LoadTemplatesOptions = {
      templatesDir,
      validate: true,
      skipInvalid: false,
    };

    const templates = loadTemplates(loadOptions);
    const templateNames = Object.keys(templates).sort();

    if (templateNames.length === 0) {
      console.log(`\n📋 No templates found in: ${templatesDir}\n`);
      return 0;
    }

    console.log(`\n📋 Templates (${templateNames.length} found):\n`);

    // Group templates by category
    const templatesByCategory: Record<string, Template[]> = {};

    for (const name of templateNames) {
      const template = templates[name];
      if (!templatesByCategory[template.category]) {
        templatesByCategory[template.category] = [];
      }
      templatesByCategory[template.category].push(template);
    }

    // Display templates grouped by category
    const categoryOrder = ["language", "workflow", "team", "domain"];

    for (const category of categoryOrder) {
      if (templatesByCategory[category]) {
        console.log(`${category.toUpperCase()}`);
        for (const template of templatesByCategory[category]) {
          console.log(`  ${template.name}`);
          console.log(`    ${template.description}`);
          if (template.tags && template.tags.length > 0) {
            console.log(`    Tags: ${template.tags.join(", ")}`);
          }
          if (options.verbose && template.documentation) {
            console.log(`    ${template.documentation.slice(0, 100)}${template.documentation.length > 100 ? "..." : ""}`);
          }
        }
        console.log();
      }
    }

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
 * Show templates command help
 */
function showTemplatesHelp(): void {
  console.log(`
Usage: olimpus templates <subcommand> [options]

Manage and explore meta-agent templates.

Subcommands:
  list              List all available templates
  preview           Preview a specific template
  apply             Apply a template to your configuration

Options:
  -h, --help       Show this help message

Examples:
  olimpus templates list
  olimpus templates preview python-dev
  olimpus templates apply python-dev --dry-run
  olimpus templates list --config ./custom/templates

For more information on a specific subcommand, run:
  olimpus templates <subcommand> --help
`);
}

/**
 * Show templates list help
 */
function showTemplatesListHelp(): void {
  console.log(`
Usage: olimpus templates list [options]

List all available meta-agent templates, grouped by category.

Templates are organized into categories:
  language          Language-specific routing patterns
  workflow          Team workflows and processes
  team              Team size and structure
  domain            Domain-specific use cases

Options:
  --config <dir>    Path to templates directory (default: ./templates)
  -v, --verbose     Show additional template details
  -h, --help        Show this help message

Examples:
  olimpus templates list
  olimpus templates list --verbose
  olimpus templates list --config ./my-templates
`);
}

/**
 * Templates preview subcommand handler
 */
function templatesPreviewCommand(args: string[]): number {
  const options = parseOptions(args);

  // Show help if requested
  if (options.help) {
    showTemplatesPreviewHelp();
    return 0;
  }

  try {
    // Get template name from positional arguments
    let templateName: string | undefined;
    if (options.positional.length > 0) {
      templateName = options.positional[0];
    } else {
      console.error(`\n❌ Template name is required\n`);
      showTemplatesPreviewHelp();
      return 1;
    }

    const templatesDir = options.config ?? "./templates";
    const loadOptions: LoadTemplatesOptions = {
      templatesDir,
      validate: true,
      skipInvalid: false,
    };

    const templates = loadTemplates(loadOptions);

    if (!templates[templateName]) {
      console.error(`\n❌ Template not found: ${templateName}\n`);
      console.log("Run 'olimpus templates list' to see available templates.\n");
      return 1;
    }

    const template = templates[templateName];

    console.log(`\n📋 Template: ${template.name}\n`);
    console.log(`Category: ${template.category}`);
    console.log(`Description: ${template.description}`);

    if (template.tags && template.tags.length > 0) {
      console.log(`Tags: ${template.tags.join(", ")}`);
    }

    if (template.documentation) {
      console.log(`\nDocumentation:`);
      console.log(`  ${template.documentation}`);
    }

    if (template.examples && template.examples.length > 0) {
      console.log(`\nExamples:`);
      for (const example of template.examples) {
        console.log(`  • ${example}`);
      }
    }

    if (options.verbose && template.meta_agent) {
      console.log(`\nMeta-Agent Configuration:`);
      console.log(`  Base Model: ${template.meta_agent.base_model}`);

      if (template.meta_agent.delegates_to && template.meta_agent.delegates_to.length > 0) {
        console.log(`  Delegates to: ${template.meta_agent.delegates_to.join(", ")}`);
      }

      if (template.meta_agent.routing_rules && template.meta_agent.routing_rules.length > 0) {
        console.log(`  Routing Rules: ${template.meta_agent.routing_rules.length}`);
      }

      if (template.meta_agent.prompt_template) {
        const preview = template.meta_agent.prompt_template.slice(0, 100);
        console.log(`  Prompt Template: ${preview}${template.meta_agent.prompt_template.length > 100 ? "..." : ""}`);
      }
    }

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
 * Show templates preview help
 */
function showTemplatesPreviewHelp(): void {
  console.log(`
Usage: olimpus templates preview <template-name> [options]

Display detailed information about a specific meta-agent template.

Arguments:
  <template-name>  Name of the template to preview

Options:
  --config <dir>    Path to templates directory (default: ./templates)
  -v, --verbose     Show additional template details including meta-agent configuration
  -h, --help        Show this help message

Examples:
  olimpus templates preview python-dev
  olimpus templates preview solo-developer --verbose
  olimpus templates preview data-pipeline --config ./my-templates
`);
}

/**
 * Templates apply subcommand handler
 */
function templatesApplyCommand(args: string[]): number {
  const options = parseOptions(args);

  // Show help if requested
  if (options.help) {
    showTemplatesApplyHelp();
    return 0;
  }

  try {
    // Get template name from positional arguments
    let templateName: string | undefined;
    if (options.positional.length > 0) {
      templateName = options.positional[0];
    } else {
      console.error(`\n❌ Template name is required\n`);
      showTemplatesApplyHelp();
      return 1;
    }

    const templatesDir = options.config ?? "./templates";
    const loadOptions: LoadTemplatesOptions = {
      templatesDir,
      validate: true,
      skipInvalid: false,
    };

    const templates = loadTemplates(loadOptions);

    if (!templates[templateName]) {
      console.error(`\n❌ Template not found: ${templateName}\n`);
      console.log("Run 'olimpus templates list' to see available templates.\n");
      return 1;
    }

    const template = templates[templateName];

    console.log(`\n📋 Applying template: ${template.name}\n`);
    console.log(`Category: ${template.category}`);
    console.log(`Description: ${template.description}`);
    console.log();

    if (template.meta_agent) {
      console.log(`Meta-Agent Configuration:\n`);
      console.log(`  Base Model: ${template.meta_agent.base_model}`);

      if (template.meta_agent.delegates_to && template.meta_agent.delegates_to.length > 0) {
        console.log(`  Delegates to: ${template.meta_agent.delegates_to.join(", ")}`);
      }

      if (template.meta_agent.routing_rules && template.meta_agent.routing_rules.length > 0) {
        console.log(`  Routing Rules: ${template.meta_agent.routing_rules.length}`);
        console.log();
        console.log(`  Summary of routing rules:`);
        for (let i = 0; i < template.meta_agent.routing_rules.length; i++) {
          const rule = template.meta_agent.routing_rules[i];
          console.log(`    ${i + 1}. ${rule.matcher.type} → ${rule.target_agent}`);
        }
      }

      if (template.meta_agent.prompt_template) {
        const preview = template.meta_agent.prompt_template.slice(0, 100);
        console.log();
        console.log(`  Prompt Template: ${preview}${template.meta_agent.prompt_template.length > 100 ? "..." : ""}`);
      }

      console.log();
    }

    if (options.dryRun) {
      console.log(`🔍 Dry-run mode - no changes made\n`);
      console.log(`To apply this template to your configuration:\n`);
      console.log(`  1. Create or open your olimpus.jsonc file`);
      console.log(`  2. Add the meta_agent configuration from this template`);
      console.log(`  3. Customize routing rules, prompts, and agents as needed`);
      console.log();
    } else {
      console.log(`✅ Template ready to apply\n`);
      console.log(`To apply this template to your configuration:\n`);
      console.log(`  1. Create or open your olimpus.jsonc file`);
      console.log(`  2. Add the meta_agent configuration from this template`);
      console.log(`  3. Customize routing rules, prompts, and agents as needed`);
      console.log(`  4. Run 'olimpus validate olimpus.jsonc' to verify your configuration`);
      console.log();
    }

    if (template.documentation) {
      console.log(`Documentation:\n  ${template.documentation}\n`);
    }

    if (template.examples && template.examples.length > 0) {
      console.log(`Examples:`);
      for (const example of template.examples) {
        console.log(`  • ${example}`);
      }
      console.log();
    }

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
 * Show templates apply help
 */
function showTemplatesApplyHelp(): void {
  console.log(`
Usage: olimpus templates apply <template-name> [options]

Apply a meta-agent template to your configuration. Shows what configuration
would be added without making any changes to your files.

Arguments:
  <template-name>  Name of the template to apply

Options:
  --config <dir>    Path to templates directory (default: ./templates)
  --dry-run         Show what would be applied without making changes
  -h, --help        Show this help message

Examples:
  olimpus templates apply python-dev
  olimpus templates apply python-dev --dry-run
  olimpus templates apply small-team --config ./my-templates

Note:
  This command only shows what would be applied. You must manually add the
  configuration to your olimpus.jsonc file. See the preview output for the
  exact meta_agent configuration to add.
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
  templates         Manage and explore meta-agent templates

Options:
  -h, --help       Show this help message

Examples:
  olimpus validate olimpus.jsonc
  olimpus test olimpus.jsonc
  olimpus templates list
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
    templates: {
      name: "templates",
      description: "Manage and explore meta-agent templates",
      execute: templatesCommand,
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
