/**
 * PerformanceMetricsCollector - Collects and tracks routing performance metrics
 *
 * Provides functionality to collect and aggregate performance metrics including:
 * - Routing latency (min, max, avg, p50, p95, p99)
 * - Throughput (requests per second/minute/hour)
 * - Error tracking (total errors, error rate, errors by type)
 * - Memory usage tracking (current, peak, leak detection)
 * - Match rate metrics
 *
 * Usage:
 *   const collector = new PerformanceMetricsCollector();
 *   collector.recordRoutingLatency(125);
 *   collector.recordError("timeout");
 *   const metrics = collector.getMetrics();
 */

import type {
  PerformanceMetrics,
  RoutingLatencyMetrics,
  ThroughputMetrics,
  ErrorMetrics,
  MemoryMetrics,
  MatchRateMetrics,
  TimeSeriesDataPoint,
} from "./types.js";

/**
 * Default collection window in seconds
 */
const DEFAULT_COLLECTION_WINDOW_SECONDS = 60;

/**
 * Default history size for time series data
 */
const DEFAULT_HISTORY_SIZE = 1440; // 24 hours of minute-level data

/**
 * PerformanceMetricsCollector class for tracking routing performance
 * Collects latency, throughput, memory usage, match rates, and error metrics
 * Supports time-series aggregation and percentile calculations
 */
export class PerformanceMetricsCollector {
  private enabled: boolean;
  private collectionWindowSeconds: number;
  private historySize: number;

  // Latency tracking
  private latencySamples: number[] = [];

  // Request tracking for throughput
  private requestTimestamps: number[] = [];

  // Error tracking
  private totalErrors: number = 0;
  private errorsByType: Record<string, number> = {};
  private successfulRequests: number = 0;

  // Memory tracking
  private memoryHistory: TimeSeriesDataPoint[] = [];
  private peakMemoryUsage: number = 0;

  // Match rate tracking
  private totalEvaluations: number = 0;
  private successfulMatches: number = 0;

  // Start time for window calculations
  private startTime: number;

  /**
   * Creates a new PerformanceMetricsCollector instance
   * @param enabled - Whether metrics collection is enabled
   * @param collectionWindowSeconds - Time window for aggregation in seconds
   * @param historySize - Maximum number of time-series data points to keep
   */
  constructor(
    enabled: boolean = true,
    collectionWindowSeconds: number = DEFAULT_COLLECTION_WINDOW_SECONDS,
    historySize: number = DEFAULT_HISTORY_SIZE,
  ) {
    this.enabled = enabled;
    this.collectionWindowSeconds = collectionWindowSeconds;
    this.historySize = historySize;
    this.startTime = Date.now();
  }

  /**
   * Records a routing latency measurement in milliseconds
   * @param latencyMs - Latency in milliseconds
   */
  recordRoutingLatency(latencyMs: number): void {
    if (!this.enabled || latencyMs < 0) {
      return;
    }

    try {
      this.latencySamples.push(latencyMs);
      this.requestTimestamps.push(Date.now());
      this.successfulRequests += 1;

      // Trim old samples outside the collection window
      this.trimOldSamples();
    } catch {
      // Silently fail to avoid disrupting routing logic
    }
  }

  /**
   * Records an error occurrence
   * @param errorType - Type of error (e.g., "timeout", "connection_error")
   */
  recordError(errorType: string): void {
    if (!this.enabled) {
      return;
    }

    try {
      this.totalErrors += 1;
      this.errorsByType[errorType] = (this.errorsByType[errorType] ?? 0) + 1;
    } catch {
      // Silently fail to avoid disrupting routing logic
    }
  }

  /**
   * Records a match evaluation
   * @param matched - Whether the match was successful
   */
  recordMatchEvaluation(matched: boolean): void {
    if (!this.enabled) {
      return;
    }

    try {
      this.totalEvaluations += 1;
      if (matched) {
        this.successfulMatches += 1;
      }
    } catch {
      // Silently fail to avoid disrupting routing logic
    }
  }

  /**
   * Records current memory usage for leak detection
   * Automatically captures current memory stats and updates history
   */
  recordMemoryUsage(): void {
    if (!this.enabled) {
      return;
    }

    try {
      const memoryStats = this.getCurrentMemoryStats();
      const timestamp = new Date().toISOString();

      // Update peak usage
      if (memoryStats.current_usage_bytes > this.peakMemoryUsage) {
        this.peakMemoryUsage = memoryStats.current_usage_bytes;
      }

      // Add to history
      this.memoryHistory.push({
        timestamp,
        value: memoryStats.current_usage_bytes,
      });

      // Trim history to max size
      if (this.memoryHistory.length > this.historySize) {
        this.memoryHistory.shift();
      }
    } catch {
      // Silently fail to avoid disrupting routing logic
    }
  }

  /**
   * Gets current memory usage statistics
   * @returns Current memory usage in bytes
   */
  private getCurrentMemoryStats(): {
    current_usage_bytes: number;
    heap_usage_bytes?: number;
    external_usage_bytes?: number;
    array_buffers_bytes?: number;
  } {
    try {
      const memory = process.memoryUsage();
      return {
        current_usage_bytes: memory.rss,
        heap_usage_bytes: memory.heapUsed,
        external_usage_bytes: memory.external,
        array_buffers_bytes: memory.arrayBuffers,
      };
    } catch {
      // Fallback if memory usage is not available
      return {
        current_usage_bytes: 0,
      };
    }
  }

  /**
   * Trims old samples outside the collection window
   */
  private trimOldSamples(): void {
    const now = Date.now();
    const windowMs = this.collectionWindowSeconds * 1000;
    const threshold = now - windowMs;

    // Trim latency samples (assuming they align with request timestamps)
    const samplesToKeep = Math.min(
      this.latencySamples.length,
      this.requestTimestamps.length,
    );

    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > threshold,
    );

    // Trim latency samples to match request timestamps count
    const excessLatencySamples = this.latencySamples.length - this.requestTimestamps.length;
    if (excessLatencySamples > 0) {
      this.latencySamples.splice(0, excessLatencySamples);
    }
  }

  /**
   * Computes routing latency metrics with percentiles
   * @returns Routing latency metrics
   */
  private computeRoutingLatencyMetrics(): RoutingLatencyMetrics {
    if (this.latencySamples.length === 0) {
      return {
        min_ms: 0,
        max_ms: 0,
        avg_ms: 0,
        p50_ms: 0,
        p95_ms: 0,
        p99_ms: 0,
        total_samples: 0,
      };
    }

    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg =
      sorted.reduce((sum, val) => sum + val, 0) / sorted.length;

    const getPercentile = (p: number): number => {
      const index = Math.floor((p / 100) * (sorted.length - 1));
      return sorted[index];
    };

    return {
      min_ms: min,
      max_ms: max,
      avg_ms: avg,
      p50_ms: getPercentile(50),
      p95_ms: getPercentile(95),
      p99_ms: getPercentile(99),
      total_samples: this.latencySamples.length,
    };
  }

  /**
   * Computes throughput metrics based on request timestamps
   * @returns Throughput metrics
   */
  private computeThroughputMetrics(): ThroughputMetrics {
    const now = Date.now();
    const totalRequests = this.requestTimestamps.length;

    // Calculate requests in different time windows
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    const requestsPerSecond = this.requestTimestamps.filter(
      (ts) => ts > oneSecondAgo,
    ).length;

    const requestsPerMinute = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo,
    ).length;

    const requestsPerHour = this.requestTimestamps.filter(
      (ts) => ts > oneHourAgo,
    ).length;

    return {
      requests_per_second: requestsPerSecond,
      requests_per_minute: requestsPerMinute,
      requests_per_hour: requestsPerHour,
      total_requests: totalRequests,
    };
  }

  /**
   * Computes error metrics
   * @returns Error metrics
   */
  private computeErrorMetrics(): ErrorMetrics {
    const totalRequests = this.successfulRequests + this.totalErrors;
    const errorRate = totalRequests > 0 ? this.totalErrors / totalRequests : 0;

    return {
      total_errors: this.totalErrors,
      error_rate: errorRate,
      errors_by_type: { ...this.errorsByType },
    };
  }

  /**
   * Computes memory metrics with leak detection
   * @returns Memory metrics
   */
  private computeMemoryMetrics(): MemoryMetrics {
    const currentStats = this.getCurrentMemoryStats();
    const leakTrend = this.detectMemoryLeakTrend();

    return {
      current_usage_bytes: currentStats.current_usage_bytes,
      peak_usage_bytes: this.peakMemoryUsage,
      heap_usage_bytes: currentStats.heap_usage_bytes,
      external_usage_bytes: currentStats.external_usage_bytes,
      array_buffers_bytes: currentStats.array_buffers_bytes,
      leak_detected: leakTrend === "increasing" && this.isMemoryLeakSignificant(),
      leak_trend: leakTrend,
    };
  }

  /**
   * Detects memory leak trend by analyzing history
   * @returns Leak trend status
   */
  private detectMemoryLeakTrend(): "stable" | "increasing" | "decreasing" {
    if (this.memoryHistory.length < 10) {
      return "stable";
    }

    // Compare recent 10% with earlier 10%
    const sampleSize = Math.max(5, Math.floor(this.memoryHistory.length * 0.1));
    const recent = this.memoryHistory.slice(-sampleSize);
    const earlier = this.memoryHistory.slice(-sampleSize * 2, -sampleSize);

    const recentAvg =
      recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const earlierAvg =
      earlier.reduce((sum, p) => sum + p.value, 0) / earlier.length;

    const threshold = 0.1; // 10% change threshold

    if (recentAvg > earlierAvg * (1 + threshold)) {
      return "increasing";
    } else if (recentAvg < earlierAvg * (1 - threshold)) {
      return "decreasing";
    }

    return "stable";
  }

  /**
   * Determines if a memory leak is significant
   * A leak is considered significant if:
   * - Memory is trending up
   * - Current usage is > 50% of peak
   * - History spans at least 30 minutes
   * @returns Whether the memory leak is significant
   */
  private isMemoryLeakSignificant(): boolean {
    if (this.memoryHistory.length < 30) {
      // Need at least 30 data points (assuming 1-minute intervals)
      return false;
    }

    const currentStats = this.getCurrentMemoryStats();

    // Check if current usage is high relative to peak
    return currentStats.current_usage_bytes > this.peakMemoryUsage * 0.5;
  }

  /**
   * Computes match rate metrics
   * @returns Match rate metrics
   */
  private computeMatchRateMetrics(): MatchRateMetrics {
    const matchRate =
      this.totalEvaluations > 0
        ? this.successfulMatches / this.totalEvaluations
        : 0;

    return {
      total_evaluations: this.totalEvaluations,
      successful_matches: this.successfulMatches,
      match_rate: matchRate,
      unmatched_requests: this.totalEvaluations - this.successfulMatches,
    };
  }

  /**
   * Gets all collected performance metrics
   * @returns Complete performance metrics snapshot
   */
  getMetrics(): PerformanceMetrics {
    if (!this.enabled) {
      return this.createEmptyMetrics();
    }

    const routingLatency = this.computeRoutingLatencyMetrics();
    const throughput = this.computeThroughputMetrics();
    const errors = this.computeErrorMetrics();
    const memory = this.computeMemoryMetrics();
    const matchRates = this.computeMatchRateMetrics();

    return {
      timestamp: new Date().toISOString(),
      routing_latency: routingLatency,
      throughput: throughput,
      errors: errors,
      memory: memory,
      match_rates: matchRates,
      collection_window_seconds: this.collectionWindowSeconds,
    };
  }

  /**
   * Creates empty metrics structure
   * @returns Empty performance metrics
   */
  private createEmptyMetrics(): PerformanceMetrics {
    const now = new Date().toISOString();

    return {
      timestamp: now,
      routing_latency: {
        min_ms: 0,
        max_ms: 0,
        avg_ms: 0,
        p50_ms: 0,
        p95_ms: 0,
        p99_ms: 0,
        total_samples: 0,
      },
      throughput: {
        requests_per_second: 0,
        requests_per_minute: 0,
        requests_per_hour: 0,
        total_requests: 0,
      },
      errors: {
        total_errors: 0,
        error_rate: 0,
        errors_by_type: {},
      },
      memory: {
        current_usage_bytes: 0,
        peak_usage_bytes: 0,
        heap_usage_bytes: 0,
        external_usage_bytes: 0,
        array_buffers_bytes: 0,
        leak_detected: false,
        leak_trend: "stable",
      },
      match_rates: {
        total_evaluations: 0,
        successful_matches: 0,
        match_rate: 0,
        unmatched_requests: 0,
      },
      collection_window_seconds: this.collectionWindowSeconds,
    };
  }

  /**
   * Gets latency metrics only
   * @returns Routing latency metrics
   */
  getLatencyMetrics(): RoutingLatencyMetrics {
    if (!this.enabled) {
      return {
        min_ms: 0,
        max_ms: 0,
        avg_ms: 0,
        p50_ms: 0,
        p95_ms: 0,
        p99_ms: 0,
        total_samples: 0,
      };
    }

    return this.computeRoutingLatencyMetrics();
  }

  /**
   * Gets throughput metrics only
   * @returns Throughput metrics
   */
  getThroughputMetrics(): ThroughputMetrics {
    if (!this.enabled) {
      return {
        requests_per_second: 0,
        requests_per_minute: 0,
        requests_per_hour: 0,
        total_requests: 0,
      };
    }

    return this.computeThroughputMetrics();
  }

  /**
   * Gets error metrics only
   * @returns Error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    if (!this.enabled) {
      return {
        total_errors: 0,
        error_rate: 0,
        errors_by_type: {},
      };
    }

    return this.computeErrorMetrics();
  }

  /**
   * Gets memory metrics only
   * @returns Memory metrics
   */
  getMemoryMetrics(): MemoryMetrics {
    if (!this.enabled) {
      return {
        current_usage_bytes: 0,
        peak_usage_bytes: 0,
        heap_usage_bytes: 0,
        external_usage_bytes: 0,
        array_buffers_bytes: 0,
        leak_detected: false,
        leak_trend: "stable",
      };
    }

    return this.computeMemoryMetrics();
  }

  /**
   * Gets match rate metrics only
   * @returns Match rate metrics
   */
  getMatchRateMetrics(): MatchRateMetrics {
    if (!this.enabled) {
      return {
        total_evaluations: 0,
        successful_matches: 0,
        match_rate: 0,
        unmatched_requests: 0,
      };
    }

    return this.computeMatchRateMetrics();
  }

  /**
   * Gets memory usage history for time-series visualization
   * @param limit - Maximum number of data points to return
   * @returns Array of time-series data points
   */
  getMemoryHistory(limit?: number): TimeSeriesDataPoint[] {
    if (!this.enabled) {
      return [];
    }

    const history = [...this.memoryHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Resets all metrics to initial state
   */
  reset(): void {
    if (!this.enabled) {
      return;
    }

    try {
      this.latencySamples = [];
      this.requestTimestamps = [];
      this.totalErrors = 0;
      this.errorsByType = {};
      this.successfulRequests = 0;
      this.memoryHistory = [];
      this.peakMemoryUsage = 0;
      this.totalEvaluations = 0;
      this.successfulMatches = 0;
      this.startTime = Date.now();
    } catch {
      // Silently fail to avoid disrupting routing logic
    }
  }

  /**
   * Checks if metrics collection is enabled
   * @returns Whether metrics collection is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables metrics collection
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disables metrics collection
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Gets the number of latency samples collected
   * @returns Sample count
   */
  getSampleCount(): number {
    if (!this.enabled) {
      return 0;
    }

    return this.latencySamples.length;
  }

  /**
   * Gets the uptime since collection started
   * @returns Uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

/**
 * Convenience function to create a metrics collector
 * @param enabled - Whether metrics collection is enabled
 * @param collectionWindowSeconds - Time window for aggregation in seconds
 * @param historySize - Maximum number of time-series data points to keep
 * @returns PerformanceMetricsCollector instance
 */
export function createPerformanceMetricsCollector(
  enabled: boolean = true,
  collectionWindowSeconds: number = DEFAULT_COLLECTION_WINDOW_SECONDS,
  historySize: number = DEFAULT_HISTORY_SIZE,
): PerformanceMetricsCollector {
  return new PerformanceMetricsCollector(
    enabled,
    collectionWindowSeconds,
    historySize,
  );
}
