/**
 * AnalyticsExporter - Export analytics data in various formats
 *
 * Provides functionality to export analytics data to JSON and CSV formats.
 * Supports filtering by date range, agents, and matcher types.
 *
 * Usage:
 *   const exporter = new AnalyticsExporter(storage, aggregator);
 *   const json = exporter.exportToJson(options);
 *   await exporter.exportToFile('output.json', options);
 */

import type { AnalyticsEvent, ExportOptions, AggregationResult } from "./types.js";
import { AnalyticsAggregator } from "./aggregator.js";
import type { AnalyticsStorage } from "./storage.js";

/**
 * Export result interface
 */
export interface ExportResult {
  success: boolean;
  format: "json" | "csv";
  record_count: number;
  file_path?: string;
  error?: string;
}

/**
 * AnalyticsExporter class for exporting analytics data
 * Supports JSON and CSV export formats with filtering options
 */
export class AnalyticsExporter {
  private storage: AnalyticsStorage;
  private aggregator: AnalyticsAggregator;

  /**
   * Creates a new AnalyticsExporter instance
   * @param storage - AnalyticsStorage instance for retrieving events
   * @param aggregator - Optional AnalyticsAggregator instance for metrics
   */
  constructor(storage: AnalyticsStorage, aggregator?: AnalyticsAggregator) {
    this.storage = storage;
    this.aggregator = aggregator ?? new AnalyticsAggregator();
  }

  /**
   * Export analytics data to JSON string
   * @param options - Export options for filtering data
   * @returns JSON string of exported data
   */
  exportToJson(options: Partial<ExportOptions> = {}): string {
    try {
      const events = this.getFilteredEvents(options);

      let exportData: Record<string, unknown>;

      if (options.include_metrics !== false) {
        // Include both events and aggregated metrics
        const aggregationResult = this.getAggregationResult(options);

        exportData = {
          format: "json",
          version: "1.0.0",
          exported_at: new Date().toISOString(),
          record_count: events.length,
          options: this.sanitizeOptions(options),
          events,
          metrics: aggregationResult,
        };
      } else {
        // Export only events
        exportData = {
          format: "json",
          version: "1.0.0",
          exported_at: new Date().toISOString(),
          record_count: events.length,
          options: this.sanitizeOptions(options),
          events,
        };
      }

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to export JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Export analytics data to a file
   * Format is determined by file extension (.json or .csv)
   * @param filePath - Path to output file
   * @param options - Export options for filtering data
   * @returns Export result with success status
   */
  async exportToFile(
    filePath: string,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      let content: string;
      let format: "json" | "csv";

      // Determine format from file extension
      if (filePath.endsWith(".csv")) {
        content = this.exportToCsv(options);
        format = "csv";
      } else if (filePath.endsWith(".json")) {
        content = this.exportToJson(options);
        format = "json";
      } else {
        // Default to JSON if extension not recognized
        content = this.exportToJson(options);
        format = "json";
      }

      await Bun.write(filePath, content);

      const events = this.getFilteredEvents(options);

      return {
        success: true,
        format,
        record_count: events.length,
        file_path: filePath,
      };
    } catch (error) {
      return {
        success: false,
        format: "json",
        record_count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get events filtered by export options
   * @param options - Export options for filtering
   * @returns Filtered array of events
   */
  private getFilteredEvents(options: Partial<ExportOptions>): AnalyticsEvent[] {
    let events = this.storage.getAllEvents();

    // Filter by date range
    if (options.start_date || options.end_date) {
      const startDate = options.start_date
        ? new Date(options.start_date)
        : new Date(0);
      const endDate = options.end_date ? new Date(options.end_date) : new Date();

      events = events.filter((event) => {
        const eventTime = new Date(event.timestamp).getTime();
        return (
          eventTime >= startDate.getTime() && eventTime <= endDate.getTime()
        );
      });
    }

    // Filter by agent names
    if (options.agent_names && options.agent_names.length > 0) {
      const agentSet = new Set(options.agent_names);
      events = events.filter((event) => {
        return (
          event.type === "routing_decision" &&
          agentSet.has(event.target_agent)
        );
      });
    }

    // Filter by matcher types
    if (options.matcher_types && options.matcher_types.length > 0) {
      const matcherSet = new Set(options.matcher_types);
      events = events.filter((event) => {
        return (
          event.type === "routing_decision" &&
          matcherSet.has(event.matcher_type)
        );
      });
    }

    return events;
  }

  /**
   * Get aggregation result for filtered events
   * @param options - Export options for filtering
   * @returns Aggregation result with metrics
   */
  private getAggregationResult(
    options: Partial<ExportOptions>
  ): AggregationResult {
    const events = this.getFilteredEvents(options);

    // Update aggregator with filtered events
    this.aggregator.updateEvents(events);

    // Build aggregation options
    const aggregationOptions: Partial<Record<string, unknown>> = {};
    if (options.start_date) {
      aggregationOptions.start_date = options.start_date;
    }
    if (options.end_date) {
      aggregationOptions.end_date = options.end_date;
    }
    if (options.agent_names) {
      aggregationOptions.agent_names = options.agent_names;
    }
    if (options.matcher_types) {
      aggregationOptions.matcher_types = options.matcher_types;
    }

    return this.aggregator.aggregate(
      aggregationOptions as Partial<Parameters<typeof this.aggregator.aggregate>[0]>
    );
  }

  /**
   * Sanitize options for export metadata
   * Removes sensitive or unnecessary information
   * @param options - Export options to sanitize
   * @returns Sanitized options object
   */
  private sanitizeOptions(
    options: Partial<ExportOptions>
  ): Record<string, unknown> {
    return {
      format: options.format ?? "json",
      include_raw_events: options.include_raw_events ?? true,
      include_metrics: options.include_metrics ?? true,
      start_date: options.start_date,
      end_date: options.end_date,
      agent_count: options.agent_names?.length ?? 0,
      matcher_count: options.matcher_types?.length ?? 0,
    };
  }

  /**
   * Export analytics data to CSV string
   * @param options - Export options for filtering data
   * @returns CSV string of exported data
   */
  exportToCsv(options: Partial<ExportOptions> = {}): string {
    try {
      const events = this.getFilteredEvents(options);

      // Define CSV headers - include all possible fields for both event types
      const headers = [
        "timestamp",
        "type",
        "target_agent",
        "matcher_type",
        "matched_content",
        "config_model",
        "config_temperature",
        "config_prompt",
        "config_variant",
        "user_request",
        "meta_agent",
      ];

      // Build CSV rows
      const rows = [headers.join(",")];

      for (const event of events) {
        const row = [
          event.timestamp,
          event.type,
          // Routing decision specific fields
          event.type === "routing_decision"
            ? this.escapeCsvValue(event.target_agent)
            : "",
          event.type === "routing_decision"
            ? this.escapeCsvValue(event.matcher_type)
            : "",
          event.type === "routing_decision"
            ? this.escapeCsvValue(event.matched_content ?? "")
            : "",
          // Config overrides
          event.type === "routing_decision" && event.config_overrides
            ? this.escapeCsvValue(event.config_overrides.model ?? "")
            : "",
          event.type === "routing_decision" && event.config_overrides
            ? this.escapeCsvValue(
                event.config_overrides.temperature?.toString() ?? ""
              )
            : "",
          event.type === "routing_decision" && event.config_overrides
            ? this.escapeCsvValue(event.config_overrides.prompt ?? "")
            : "",
          event.type === "routing_decision" && event.config_overrides
            ? this.escapeCsvValue(event.config_overrides.variant ?? "")
            : "",
          // Unmatched request specific fields
          event.type === "unmatched_request"
            ? this.escapeCsvValue(event.user_request)
            : "",
          // Common field
          this.escapeCsvValue(event.meta_agent ?? ""),
        ];

        rows.push(row.join(","));
      }

      return rows.join("\n");
    } catch (error) {
      throw new Error(
        `Failed to export CSV: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Escape CSV value according to RFC 4180
   * Wraps values containing quotes, commas, or newlines in quotes
   * @param value - Value to escape
   * @returns Escaped CSV value
   */
  private escapeCsvValue(value: string): string {
    if (!value) return "";
    // Check if value needs quoting
    if (
      value.includes('"') ||
      value.includes(",") ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      // Escape quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return value;
  }
}

/**
 * Convenience function to export analytics data to JSON
 * @param storage - AnalyticsStorage instance
 * @param options - Export options
 * @returns JSON string of exported data
 */
export function exportToJson(
  storage: AnalyticsStorage,
  options?: Partial<ExportOptions>
): string {
  const exporter = new AnalyticsExporter(storage);
  return exporter.exportToJson(options);
}

/**
 * Convenience function to export analytics data to CSV
 * @param storage - AnalyticsStorage instance
 * @param options - Export options
 * @returns CSV string of exported data
 */
export function exportToCsv(
  storage: AnalyticsStorage,
  options?: Partial<ExportOptions>
): string {
  const exporter = new AnalyticsExporter(storage);
  return exporter.exportToCsv(options);
}

/**
 * Convenience function to export analytics data to file
 * @param storage - AnalyticsStorage instance
 * @param filePath - Path to output file
 * @param options - Export options
 * @returns Export result with success status
 */
export async function exportToFile(
  storage: AnalyticsStorage,
  filePath: string,
  options?: Partial<ExportOptions>
): Promise<ExportResult> {
  const exporter = new AnalyticsExporter(storage);
  return exporter.exportToFile(filePath, options);
}
