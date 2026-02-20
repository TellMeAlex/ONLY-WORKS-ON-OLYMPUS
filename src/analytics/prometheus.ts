/**
 * PrometheusMetricsFormatter - Format performance metrics for Prometheus
 *
 * Provides functionality to format performance metrics into Prometheus exposition format.
 * Supports all metric types from PerformanceMetrics including routing latency,
 * throughput, errors, memory usage, and match rates.
 *
 * Usage:
 *   const formatter = new PrometheusMetricsFormatter();
 *   const metrics = collector.getMetrics();
 *   const prometheusText = formatter.format(metrics);
 *
 * Prometheus format follows:
 *   # HELP metric_name description
 *   # TYPE metric_name type
 *   metric_name{label_key="label_value"} value timestamp
 */

import type { PerformanceMetrics } from "./types.js";

/**
 * Prometheus metric type
 */
export type PrometheusMetricType = "counter" | "gauge" | "histogram" | "summary";

/**
 * Prometheus metric definition
 */
interface PrometheusMetricDefinition {
  name: string;
  type: PrometheusMetricType;
  help: string;
}

/**
 * Prometheus formatter options
 */
export interface PrometheusFormatterOptions {
  /**
   * Include HELP comments
   * @default true
   */
  includeHelp?: boolean;

  /**
   * Include TYPE comments
   * @default true
   */
  includeType?: boolean;

  /**
   * Include timestamp in metric lines
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Custom metric name prefix
   * @default "routing_"
   */
  metricPrefix?: string;
}

/**
 * PrometheusMetricsFormatter class for exporting metrics in Prometheus format
 * Converts PerformanceMetrics to Prometheus exposition format text
 */
export class PrometheusMetricsFormatter {
  private options: Required<PrometheusFormatterOptions>;
  private metrics: readonly PrometheusMetricDefinition[];

  /**
   * Creates a new PrometheusMetricsFormatter instance
   * @param options - Formatting options
   */
  constructor(options: Partial<PrometheusFormatterOptions> = {}) {
    this.options = {
      includeHelp: options.includeHelp ?? true,
      includeType: options.includeType ?? true,
      includeTimestamp: options.includeTimestamp ?? true,
      metricPrefix: options.metricPrefix ?? "routing_",
    };

    this.metrics = this.defineMetrics();
  }

  /**
   * Defines all Prometheus metrics with their metadata
   * @returns Array of metric definitions
   */
  private defineMetrics(): readonly PrometheusMetricDefinition[] {
    const prefix = this.options.metricPrefix;

    return [
      // Routing latency metrics
      {
        name: `${prefix}latency_min_milliseconds`,
        type: "gauge",
        help: "Minimum routing latency in milliseconds",
      },
      {
        name: `${prefix}latency_max_milliseconds`,
        type: "gauge",
        help: "Maximum routing latency in milliseconds",
      },
      {
        name: `${prefix}latency_avg_milliseconds`,
        type: "gauge",
        help: "Average routing latency in milliseconds",
      },
      {
        name: `${prefix}latency_p50_milliseconds`,
        type: "gauge",
        help: "P50 (median) routing latency in milliseconds",
      },
      {
        name: `${prefix}latency_p95_milliseconds`,
        type: "gauge",
        help: "P95 routing latency in milliseconds",
      },
      {
        name: `${prefix}latency_p99_milliseconds`,
        type: "gauge",
        help: "P99 routing latency in milliseconds",
      },
      {
        name: `${prefix}latency_samples_total`,
        type: "counter",
        help: "Total number of latency samples collected",
      },
      // Throughput metrics
      {
        name: `${prefix}requests_per_second`,
        type: "gauge",
        help: "Requests per second in the last second",
      },
      {
        name: `${prefix}requests_per_minute`,
        type: "gauge",
        help: "Requests per minute in the last minute",
      },
      {
        name: `${prefix}requests_per_hour`,
        type: "gauge",
        help: "Requests per hour in the last hour",
      },
      {
        name: `${prefix}requests_total`,
        type: "counter",
        help: "Total number of requests processed",
      },
      // Error metrics
      {
        name: `${prefix}errors_total`,
        type: "counter",
        help: "Total number of errors encountered",
      },
      {
        name: `${prefix}error_rate`,
        type: "gauge",
        help: "Error rate as a ratio (0-1)",
      },
      {
        name: `${prefix}errors_by_type_total`,
        type: "counter",
        help: "Total errors by type",
      },
      // Memory metrics
      {
        name: `${prefix}memory_usage_bytes`,
        type: "gauge",
        help: "Current memory usage in bytes (RSS)",
      },
      {
        name: `${prefix}memory_peak_bytes`,
        type: "gauge",
        help: "Peak memory usage in bytes",
      },
      {
        name: `${prefix}memory_heap_bytes`,
        type: "gauge",
        help: "Current heap memory usage in bytes",
      },
      {
        name: `${prefix}memory_external_bytes`,
        type: "gauge",
        help: "External memory usage in bytes",
      },
      {
        name: `${prefix}memory_array_buffers_bytes`,
        type: "gauge",
        help: "Array buffers memory usage in bytes",
      },
      {
        name: `${prefix}memory_leak_detected`,
        type: "gauge",
        help: "Whether a memory leak has been detected (1=true, 0=false)",
      },
      {
        name: `${prefix}memory_leak_trend`,
        type: "gauge",
        help: "Memory leak trend (1=increasing, 0=stable, -1=decreasing)",
      },
      // Match rate metrics
      {
        name: `${prefix}match_evaluations_total`,
        type: "counter",
        help: "Total number of match evaluations performed",
      },
      {
        name: `${prefix}match_successes_total`,
        type: "counter",
        help: "Total number of successful matches",
      },
      {
        name: `${prefix}match_rate`,
        type: "gauge",
        help: "Match rate as a ratio (0-1)",
      },
      {
        name: `${prefix}unmatched_requests_total`,
        type: "counter",
        help: "Total number of unmatched requests",
      },
    ] as const;
  }

  /**
   * Formats performance metrics into Prometheus exposition format
   * @param metrics - Performance metrics to format
   * @returns Prometheus-formatted text
   */
  format(metrics: PerformanceMetrics): string {
    try {
      const lines: string[] = [];

      // Add HELP and TYPE comments if enabled
      if (this.options.includeHelp || this.options.includeType) {
        lines.push(...this.getMetadataLines());
        lines.push(""); // Empty line separator
      }

      // Add metric values
      lines.push(...this.getMetricLines(metrics));

      return lines.join("\n");
    } catch (error) {
      throw new Error(
        `Failed to format Prometheus metrics: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Gets HELP and TYPE comment lines for all metrics
   * @returns Array of metadata comment lines
   */
  private getMetadataLines(): string[] {
    const lines: string[] = [];

    for (const metric of this.metrics) {
      if (this.options.includeHelp) {
        lines.push(`# HELP ${metric.name} ${metric.help}`);
      }
      if (this.options.includeType) {
        lines.push(`# TYPE ${metric.name} ${metric.type}`);
      }
    }

    return lines;
  }

  /**
   * Gets metric value lines for the given metrics
   * @param metrics - Performance metrics to convert
   * @returns Array of metric value lines
   */
  private getMetricLines(metrics: PerformanceMetrics): string[] {
    const lines: string[] = [];
    const prefix = this.options.metricPrefix;

    // Routing latency metrics
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_min_milliseconds`,
        metrics.routing_latency.min_ms,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_max_milliseconds`,
        metrics.routing_latency.max_ms,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_avg_milliseconds`,
        metrics.routing_latency.avg_ms,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_p50_milliseconds`,
        metrics.routing_latency.p50_ms,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_p95_milliseconds`,
        metrics.routing_latency.p95_ms,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_p99_milliseconds`,
        metrics.routing_latency.p99_ms,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}latency_samples_total`,
        metrics.routing_latency.total_samples,
        metrics.timestamp
      )
    );

    // Throughput metrics
    lines.push(
      this.formatMetricLine(
        `${prefix}requests_per_second`,
        metrics.throughput.requests_per_second,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}requests_per_minute`,
        metrics.throughput.requests_per_minute,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}requests_per_hour`,
        metrics.throughput.requests_per_hour,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}requests_total`,
        metrics.throughput.total_requests,
        metrics.timestamp
      )
    );

    // Error metrics
    lines.push(
      this.formatMetricLine(
        `${prefix}errors_total`,
        metrics.errors.total_errors,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}error_rate`,
        metrics.errors.error_rate,
        metrics.timestamp
      )
    );

    // Error metrics by type (with labels)
    for (const [errorType, count] of Object.entries(metrics.errors.errors_by_type)) {
      const labelValue = this.escapeLabelValue(errorType);
      lines.push(
        this.formatMetricLine(
          `${prefix}errors_by_type_total{error_type="${labelValue}"}`,
          count,
          metrics.timestamp
        )
      );
    }

    // Memory metrics
    lines.push(
      this.formatMetricLine(
        `${prefix}memory_usage_bytes`,
        metrics.memory.current_usage_bytes,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}memory_peak_bytes`,
        metrics.memory.peak_usage_bytes,
        metrics.timestamp
      )
    );
    if (metrics.memory.heap_usage_bytes !== undefined) {
      lines.push(
        this.formatMetricLine(
          `${prefix}memory_heap_bytes`,
          metrics.memory.heap_usage_bytes,
          metrics.timestamp
        )
      );
    }
    if (metrics.memory.external_usage_bytes !== undefined) {
      lines.push(
        this.formatMetricLine(
          `${prefix}memory_external_bytes`,
          metrics.memory.external_usage_bytes,
          metrics.timestamp
        )
      );
    }
    if (metrics.memory.array_buffers_bytes !== undefined) {
      lines.push(
        this.formatMetricLine(
          `${prefix}memory_array_buffers_bytes`,
          metrics.memory.array_buffers_bytes,
          metrics.timestamp
        )
      );
    }
    lines.push(
      this.formatMetricLine(
        `${prefix}memory_leak_detected`,
        metrics.memory.leak_detected ? 1 : 0,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}memory_leak_trend`,
        this.leakTrendToValue(metrics.memory.leak_trend),
        metrics.timestamp
      )
    );

    // Match rate metrics
    lines.push(
      this.formatMetricLine(
        `${prefix}match_evaluations_total`,
        metrics.match_rates.total_evaluations,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}match_successes_total`,
        metrics.match_rates.successful_matches,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}match_rate`,
        metrics.match_rates.match_rate,
        metrics.timestamp
      )
    );
    lines.push(
      this.formatMetricLine(
        `${prefix}unmatched_requests_total`,
        metrics.match_rates.unmatched_requests,
        metrics.timestamp
      )
    );

    return lines;
  }

  /**
   * Formats a single metric line
   * @param metricName - Name of the metric (including labels if any)
   * @param value - Metric value
   * @param timestamp - ISO timestamp string
   * @returns Formatted metric line
   */
  private formatMetricLine(
    metricName: string,
    value: number,
    timestamp: string
  ): string {
    const formattedValue = this.formatValue(value);

    if (this.options.includeTimestamp) {
      const ts = this.timestampToMilliseconds(timestamp);
      return `${metricName} ${formattedValue} ${ts}`;
    }

    return `${metricName} ${formattedValue}`;
  }

  /**
   * Formats a metric value for Prometheus
   * Handles NaN, Infinity, and precision
   * @param value - Value to format
   * @returns Formatted value string
   */
  private formatValue(value: number): string {
    // Handle special values
    if (Number.isNaN(value)) {
      return "NaN";
    }
    if (!Number.isFinite(value)) {
      return value > 0 ? "+Inf" : "-Inf";
    }

    // Format with appropriate precision
    return value.toExponential();
  }

  /**
   * Converts ISO timestamp string to milliseconds since epoch
   * @param timestamp - ISO timestamp string
   * @returns Milliseconds since epoch
   */
  private timestampToMilliseconds(timestamp: string): number {
    try {
      return new Date(timestamp).getTime();
    } catch {
      return Date.now();
    }
  }

  /**
   * Converts leak trend string to numeric value for Prometheus
   * @param trend - Leak trend string
   * @returns Numeric value (1=increasing, 0=stable, -1=decreasing)
   */
  private leakTrendToValue(trend: "stable" | "increasing" | "decreasing"): number {
    switch (trend) {
      case "increasing":
        return 1;
      case "decreasing":
        return -1;
      default:
        return 0;
    }
  }

  /**
   * Escapes label values according to Prometheus specification
   * Backslash, newline, double quote are escaped with backslash
   * @param value - Label value to escape
   * @returns Escaped label value
   */
  private escapeLabelValue(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/"/g, '\\"');
  }

  /**
   * Formats multiple metrics into a single Prometheus output
   * @param metricsArray - Array of performance metrics
   * @returns Prometheus-formatted text with all metrics
   */
  formatMany(metricsArray: PerformanceMetrics[]): string {
    const formattedMetrics = metricsArray.map((m) => this.format(m));
    return formattedMetrics.join("\n\n");
  }

  /**
   * Gets the current formatter options
   * @returns Current formatter options
   */
  getOptions(): Readonly<Required<PrometheusFormatterOptions>> {
    return this.options;
  }

  /**
   * Updates formatter options
   * @param options - New options to apply (partial)
   */
  updateOptions(options: Partial<PrometheusFormatterOptions>): void {
    if (options.includeHelp !== undefined) {
      this.options.includeHelp = options.includeHelp;
    }
    if (options.includeType !== undefined) {
      this.options.includeType = options.includeType;
    }
    if (options.includeTimestamp !== undefined) {
      this.options.includeTimestamp = options.includeTimestamp;
    }
    if (options.metricPrefix !== undefined) {
      this.options.metricPrefix = options.metricPrefix;
    }
  }

  /**
   * Gets all defined metric names
   * @returns Array of metric names
   */
  getMetricNames(): readonly string[] {
    return this.metrics.map((m) => m.name);
  }

  /**
   * Gets metric definition by name
   * @param name - Metric name to look up
   * @returns Metric definition or undefined if not found
   */
  getMetricDefinition(name: string): PrometheusMetricDefinition | undefined {
    return this.metrics.find((m) => m.name === name);
  }
}

/**
 * Convenience function to format metrics to Prometheus format
 * @param metrics - Performance metrics to format
 * @param options - Optional formatter options
 * @returns Prometheus-formatted text
 */
export function formatToPrometheus(
  metrics: PerformanceMetrics,
  options?: Partial<PrometheusFormatterOptions>
): string {
  const formatter = new PrometheusMetricsFormatter(options);
  return formatter.format(metrics);
}

/**
 * Convenience function to format multiple metrics to Prometheus format
 * @param metricsArray - Array of performance metrics to format
 * @param options - Optional formatter options
 * @returns Prometheus-formatted text with all metrics
 */
export function formatManyToPrometheus(
  metricsArray: PerformanceMetrics[],
  options?: Partial<PrometheusFormatterOptions>
): string {
  const formatter = new PrometheusMetricsFormatter(options);
  return formatter.formatMany(metricsArray);
}
