import type { Matcher, RoutingLoggerConfig } from "../config/schema.js";
import { dirname } from "path";
import { mkdirSync, appendFileSync } from "fs";
import { info, bold, dim } from "../utils/colors.js";

export interface MatcherEvaluation {
  matcher_type: string;
  matcher: Matcher;
  matched: boolean;
}

export interface RoutingLogEntry {
  timestamp: string;
  target_agent: string;
  matcher_type: string;
  matched_content: string;
  config_overrides?: {
    model?: string;
    temperature?: number;
    prompt?: string;
    variant?: string;
  };
  debug_info?: {
    all_evaluated: MatcherEvaluation[];
    total_evaluated: number;
  };
}

/**
 * RoutingLogger class for logging routing decisions
 * Supports console, file, and disabled output modes
 * Includes debug mode for comprehensive evaluation tracking
 * Supports colored console output when enabled for better readability
 */
export class RoutingLogger {
  private config: {
    enabled: boolean;
    output: "console" | "file" | "disabled";
    log_file: string;
    debug_mode: boolean;
    colored: boolean;
  };
  private enabled: boolean;

  constructor(config: RoutingLoggerConfig = {}) {
    // Apply defaults
    this.config = {
      enabled: config.enabled ?? true,
      output: config.output ?? "console",
      log_file: config.log_file ?? "routing.log",
      debug_mode: config.debug_mode ?? false,
      colored: config.colored ?? false,
    };

    // Determine if logging is enabled based on both enabled flag and output mode
    this.enabled = this.config.enabled && this.config.output !== "disabled";
  }

  /**
   * Logs a routing decision with structured JSON format
   * Includes timestamp, matcher type, matched content, and selected agent
   */
  logRoutingDecision(
    targetAgent: string,
    matcherType: string,
    matchedContent: string,
    configOverrides?: {
      model?: string;
      temperature?: number;
      prompt?: string;
      variant?: string;
    },
    allEvaluations?: MatcherEvaluation[],
  ): void {
    if (!this.enabled) {
      return;
    }

    const entry: RoutingLogEntry = {
      timestamp: new Date().toISOString(),
      target_agent: targetAgent,
      matcher_type: matcherType,
      matched_content: matchedContent,
      config_overrides: configOverrides,
    };

    // Add debug info if debug mode is enabled and evaluations are provided
    if (this.config.debug_mode && allEvaluations) {
      entry.debug_info = {
        all_evaluated: allEvaluations,
        total_evaluated: allEvaluations.length,
      };
    }

    const logLine = JSON.stringify(entry);

    try {
      switch (this.config.output) {
        case "console":
          if (this.config.colored) {
            console.log(this.formatColoredOutput(entry));
          } else {
            console.log(logLine);
          }
          break;
        case "file":
          this.writeToFile(logLine);
          break;
        case "disabled":
          // Do nothing
          break;
        default:
          // Invalid output mode - do nothing
          break;
      }
    } catch (error) {
      // Silently fail to avoid disrupting routing logic
      // Error is swallowed per performance pattern - minimal overhead
    }
  }

  /**
   * Formats a routing log entry with colored output for console display
   * Uses cyan for info, bold for emphasis, dim for secondary details
   */
  private formatColoredOutput(entry: RoutingLogEntry): string {
    const parts: string[] = [];

    // Timestamp in dim
    parts.push(dim(entry.timestamp));

    // Routing decision message with info color
    parts.push(info("Routing decision:"));

    // Target agent in bold
    parts.push(bold(`→ ${entry.target_agent}`));

    // Matcher type
    parts.push(`(${entry.matcher_type})`);

    // Matched content in dim
    const contentPreview = entry.matched_content.length > 50
      ? entry.matched_content.slice(0, 50) + "..."
      : entry.matched_content;
    parts.push(dim(`matched: "${contentPreview}"`));

    // Config overrides if present
    if (entry.config_overrides) {
      const overrides: string[] = [];
      if (entry.config_overrides.model) overrides.push(`model:${entry.config_overrides.model}`);
      if (entry.config_overrides.temperature !== undefined) overrides.push(`temp:${entry.config_overrides.temperature}`);
      if (entry.config_overrides.variant) overrides.push(`variant:${entry.config_overrides.variant}`);
      if (overrides.length > 0) {
        parts.push(dim(`[${overrides.join(", ")}]`));
      }
    }

    // Debug info if present
    if (entry.debug_info) {
      parts.push(dim(`(evaluated ${entry.debug_info.total_evaluated} matcher(s))`));
    }

    return parts.join(" ");
  }

  /**
   * Writes a log line to the configured log file
   * Appends to existing file with newline separator
   */
  private writeToFile(logLine: string): void {
    try {
      // Ensure parent directory exists
      const dir = dirname(this.config.log_file);
      try {
        mkdirSync(dir, { recursive: true });
      } catch {
        // Directory might already exist, ignore error
      }

      // Use synchronous file append for immediate write
      appendFileSync(this.config.log_file, logLine + "\n");
    } catch (error) {
      // Silently fail to avoid disrupting routing logic
      // Error is swallowed per performance pattern - minimal overhead
    }
  }

  /**
   * Checks if logging is currently enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Checks if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.config.debug_mode;
  }
}
