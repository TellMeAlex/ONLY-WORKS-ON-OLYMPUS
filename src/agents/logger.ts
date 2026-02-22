import type { Matcher, RoutingLoggerConfig } from "../config/schema.js";
import { dirname } from "path";
import { mkdirSync, appendFileSync } from "fs";

/**
 * Result of evaluating a single matcher during routing.
 *
 * @since 0.1.0
 * @stable
 *
 * Captures the evaluation outcome of a matcher including the matcher
 * configuration and whether it matched the context.
 */
export interface MatcherEvaluation {
  matcher_type: string;
  matcher: Matcher;
  matched: boolean;
}

/**
 * A single routing decision log entry.
 *
 * @since 0.1.0
 * @stable
 *
 * Structured JSON log entry containing timestamp, selected agent, matcher
 * information, and optional debug details about all evaluated matchers.
 */
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
 * RoutingLogger class for logging routing decisions.
 *
 * @since 0.1.0
 * @stable
 *
 * Supports console, file, and disabled output modes. Includes debug mode
 * for comprehensive evaluation tracking when debugging routing logic.
 *
 * @example
 * ```ts
 * const logger = new RoutingLogger({
 *   enabled: true,
 *   output: "console",
 *   debug_mode: true
 * });
 * logger.logRoutingDecision("agent-name", "keyword", "matched keywords: test");
 * ```
 */
export class RoutingLogger {
  private config: {
    enabled: boolean;
    output: "console" | "file" | "disabled";
    log_file: string;
    debug_mode: boolean;
  };
  private enabled: boolean;

  /**
   * Creates a new RoutingLogger instance.
   *
   * @since 0.1.0
   * @stable
   *
   * @param config - Logger configuration with options for enablement,
   *   output mode, log file path, and debug mode
   */
  constructor(config: RoutingLoggerConfig = {}) {
    // Apply defaults
    this.config = {
      enabled: config.enabled ?? true,
      output: config.output ?? "console",
      log_file: config.log_file ?? "routing.log",
      debug_mode: config.debug_mode ?? false,
    };

    // Determine if logging is enabled based on both enabled flag and output mode
    this.enabled = this.config.enabled && this.config.output !== "disabled";
  }

  /**
   * Logs a routing decision with structured JSON format.
   *
   * @since 0.1.0
   * @stable
   *
   * Includes timestamp, matcher type, matched content, and selected agent.
   * In debug mode, also includes full evaluation information.
   *
   * @param targetAgent - The agent that was selected
   * @param matcherType - The type of matcher that triggered the selection
   * @param matchedContent - Human-readable description of what was matched
   * @param configOverrides - Optional configuration overrides applied
   * @param allEvaluations - Optional full evaluation list for debug mode
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
          console.log(logLine);
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
   * Checks if logging is currently enabled.
   *
   * @since 0.1.0
   * @stable
   *
   * @returns true if logging is enabled and output mode is not "disabled"
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Checks if debug mode is enabled.
   *
   * @since 0.1.0
   * @stable
   *
   * @returns true if debug mode is enabled, which includes full evaluation
   *   information in log entries
   */
  isDebugMode(): boolean {
    return this.config.debug_mode;
  }
}
