import { beforeEach, describe, expect, test } from "bun:test";
import {
	PerformanceMetricsCollector,
	createPerformanceMetricsCollector,
} from "./metrics.js";
import type { PerformanceMetrics } from "./types.js";

describe("PerformanceMetricsCollector", () => {
	let collector: PerformanceMetricsCollector;

	beforeEach(() => {
		// Create a fresh collector for each test
		collector = new PerformanceMetricsCollector();
	});

	describe("constructor", () => {
		test("creates collector with default config", () => {
			// Act
			collector = new PerformanceMetricsCollector();

			// Assert
			expect(collector.isEnabled()).toBe(true);
			expect(collector.getSampleCount()).toBe(0);
		});

		test("creates collector with enabled flag", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);

			// Assert
			expect(collector.isEnabled()).toBe(false);
		});

		test("creates collector with custom collection window", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(true, 120);

			// Act
			const metrics = collector.getMetrics();

			// Assert
			expect(metrics.collection_window_seconds).toBe(120);
		});

		test("creates collector with custom history size", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(true, 60, 100);

			// Act
			for (let i = 0; i < 150; i++) {
				collector.recordMemoryUsage();
			}

			const history = collector.getMemoryHistory();

			// Assert - should trim to historySize
			expect(history.length).toBe(100);
		});

		test("creates collector with all custom parameters", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(true, 30, 500);

			// Act
			const metrics = collector.getMetrics();

			// Assert
			expect(metrics.collection_window_seconds).toBe(30);
			expect(collector.isEnabled()).toBe(true);
		});
	});

	describe("recordRoutingLatency", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("records a latency successfully", () => {
			// Act
			collector.recordRoutingLatency(125);

			// Assert
			expect(collector.getSampleCount()).toBe(1);
			const latency = collector.getLatencyMetrics();
			expect(latency.total_samples).toBe(1);
			expect(latency.avg_ms).toBe(125);
		});

		test("records multiple latency values", () => {
			// Act
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(200);
			collector.recordRoutingLatency(300);

			// Assert
			expect(collector.getSampleCount()).toBe(3);
			const latency = collector.getLatencyMetrics();
			expect(latency.total_samples).toBe(3);
			expect(latency.avg_ms).toBe(200);
			expect(latency.min_ms).toBe(100);
			expect(latency.max_ms).toBe(300);
		});

		test("increments successful requests counter", () => {
			// Act
			collector.recordRoutingLatency(100);
			collector.recordError("test_error");

			// Assert
			const errors = collector.getErrorMetrics();
			expect(errors.total_errors).toBe(1);
			// error_rate should be 1/(1+1) = 0.5
			expect(errors.error_rate).toBe(0.5);
		});

		test("rejects negative latency values", () => {
			// Act
			collector.recordRoutingLatency(-50);

			// Assert
			expect(collector.getSampleCount()).toBe(0);
			const latency = collector.getLatencyMetrics();
			expect(latency.total_samples).toBe(0);
		});

		test("does not record when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);

			// Act
			collector.recordRoutingLatency(100);

			// Assert
			expect(collector.getSampleCount()).toBe(0);
			const latency = collector.getLatencyMetrics();
			expect(latency.total_samples).toBe(0);
		});

		test("handles errors gracefully", () => {
			// Act & Assert - should not throw
			expect(() => collector.recordRoutingLatency(100)).not.toThrow();
		});
	});

	describe("recordError", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("records an error successfully", () => {
			// Act
			collector.recordError("timeout");

			// Assert
			const errors = collector.getErrorMetrics();
			expect(errors.total_errors).toBe(1);
			expect(errors.errors_by_type.timeout).toBe(1);
		});

		test("records multiple errors of the same type", () => {
			// Act
			collector.recordError("timeout");
			collector.recordError("timeout");
			collector.recordError("timeout");

			// Assert
			const errors = collector.getErrorMetrics();
			expect(errors.total_errors).toBe(3);
			expect(errors.errors_by_type.timeout).toBe(3);
		});

		test("tracks errors by type", () => {
			// Act
			collector.recordError("timeout");
			collector.recordError("connection_error");
			collector.recordError("timeout");
			collector.recordError("validation_error");

			// Assert
			const errors = collector.getErrorMetrics();
			expect(errors.total_errors).toBe(4);
			expect(errors.errors_by_type.timeout).toBe(2);
			expect(errors.errors_by_type.connection_error).toBe(1);
			expect(errors.errors_by_type.validation_error).toBe(1);
		});

		test("calculates correct error rate with successful requests", () => {
			// Arrange
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(100);
			collector.recordError("timeout");

			// Act
			const errors = collector.getErrorMetrics();

			// Assert - 1 error / (2 successful + 1 error) = 1/3
			expect(errors.total_errors).toBe(1);
			expect(errors.error_rate).toBeCloseTo(0.333, 3);
		});

		test("calculates error rate as 1 when no successful requests", () => {
			// Act
			collector.recordError("timeout");
			collector.recordError("connection_error");

			// Assert
			const errors = collector.getErrorMetrics();
			expect(errors.total_errors).toBe(2);
			expect(errors.error_rate).toBe(1);
		});

		test("does not record when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);

			// Act
			collector.recordError("timeout");

			// Assert
			const errors = collector.getErrorMetrics();
			expect(errors.total_errors).toBe(0);
			expect(Object.keys(errors.errors_by_type)).toHaveLength(0);
		});

		test("handles errors gracefully", () => {
			// Act & Assert - should not throw
			expect(() => collector.recordError("test_error")).not.toThrow();
		});
	});

	describe("recordMatchEvaluation", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("records successful match", () => {
			// Act
			collector.recordMatchEvaluation(true);

			// Assert
			const matchRates = collector.getMatchRateMetrics();
			expect(matchRates.total_evaluations).toBe(1);
			expect(matchRates.successful_matches).toBe(1);
			expect(matchRates.match_rate).toBe(1);
			expect(matchRates.unmatched_requests).toBe(0);
		});

		test("records unsuccessful match", () => {
			// Act
			collector.recordMatchEvaluation(false);

			// Assert
			const matchRates = collector.getMatchRateMetrics();
			expect(matchRates.total_evaluations).toBe(1);
			expect(matchRates.successful_matches).toBe(0);
			expect(matchRates.match_rate).toBe(0);
			expect(matchRates.unmatched_requests).toBe(1);
		});

		test("calculates match rate correctly", () => {
			// Act
			collector.recordMatchEvaluation(true);
			collector.recordMatchEvaluation(true);
			collector.recordMatchEvaluation(false);
			collector.recordMatchEvaluation(true);
			collector.recordMatchEvaluation(false);

			// Assert
			const matchRates = collector.getMatchRateMetrics();
			expect(matchRates.total_evaluations).toBe(5);
			expect(matchRates.successful_matches).toBe(3);
			expect(matchRates.match_rate).toBe(0.6);
			expect(matchRates.unmatched_requests).toBe(2);
		});

		test("handles zero evaluations", () => {
			// Act
			const matchRates = collector.getMatchRateMetrics();

			// Assert
			expect(matchRates.total_evaluations).toBe(0);
			expect(matchRates.successful_matches).toBe(0);
			expect(matchRates.match_rate).toBe(0);
			expect(matchRates.unmatched_requests).toBe(0);
		});

		test("does not record when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);

			// Act
			collector.recordMatchEvaluation(true);

			// Assert
			const matchRates = collector.getMatchRateMetrics();
			expect(matchRates.total_evaluations).toBe(0);
		});

		test("handles errors gracefully", () => {
			// Act & Assert - should not throw
			expect(() => collector.recordMatchEvaluation(true)).not.toThrow();
		});
	});

	describe("recordMemoryUsage", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true, 60, 10);
		});

		test("records memory usage", () => {
			// Act
			collector.recordMemoryUsage();

			// Assert
			const memory = collector.getMemoryMetrics();
			expect(memory.current_usage_bytes).toBeGreaterThan(0);
			expect(memory.heap_usage_bytes).toBeGreaterThanOrEqual(0);
		});

		test("tracks peak memory usage", () => {
			// Act - record multiple times
			collector.recordMemoryUsage();
			collector.recordMemoryUsage();
			collector.recordMemoryUsage();

			// Assert
			const memory = collector.getMemoryMetrics();
			expect(memory.peak_usage_bytes).toBeGreaterThan(0);
			expect(memory.peak_usage_bytes).toBeGreaterThanOrEqual(
				memory.current_usage_bytes,
			);
		});

		test("trims history to historySize", () => {
			// Act - record more than historySize
			for (let i = 0; i < 15; i++) {
				collector.recordMemoryUsage();
			}

			// Assert
			const history = collector.getMemoryHistory();
			expect(history.length).toBe(10);
		});

		test("records time series data", () => {
			// Act
			collector.recordMemoryUsage();
			collector.recordMemoryUsage();

			// Assert
			const history = collector.getMemoryHistory();
			expect(history).toHaveLength(2);
			expect(history[0]?.timestamp).toBeTruthy();
			expect(history[0]?.value).toBeGreaterThan(0);
		});

		test("does not record when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false, 60, 10);

			// Act
			collector.recordMemoryUsage();

			// Assert
			const history = collector.getMemoryHistory();
			expect(history).toHaveLength(0);
		});

		test("handles errors gracefully", () => {
			// Act & Assert - should not throw
			expect(() => collector.recordMemoryUsage()).not.toThrow();
		});
	});

	describe("getMetrics", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true, 60);
		});

		test("returns empty metrics when no data", () => {
			// Act
			const metrics = collector.getMetrics();

			// Assert
			expect(metrics.routing_latency.total_samples).toBe(0);
			expect(metrics.throughput.total_requests).toBe(0);
			expect(metrics.errors.total_errors).toBe(0);
			expect(metrics.memory.current_usage_bytes).toBe(0);
			expect(metrics.match_rates.total_evaluations).toBe(0);
			expect(metrics.collection_window_seconds).toBe(60);
		});

		test("returns complete metrics with all data", () => {
			// Arrange - record some data
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(200);
			collector.recordError("timeout");
			collector.recordMatchEvaluation(true);
			collector.recordMemoryUsage();

			// Act
			const metrics = collector.getMetrics();

			// Assert
			expect(metrics.routing_latency.total_samples).toBe(2);
			expect(metrics.throughput.total_requests).toBe(2);
			expect(metrics.errors.total_errors).toBe(1);
			expect(metrics.memory.current_usage_bytes).toBeGreaterThan(0);
			expect(metrics.match_rates.total_evaluations).toBe(1);
			expect(metrics.timestamp).toBeTruthy();
		});

		test("calculates correct latency percentiles", () => {
			// Arrange - create 100 samples
			const samples = Array.from({ length: 100 }, (_, i) => i * 10);
			samples.forEach((s) => collector.recordRoutingLatency(s));

			// Act
			const metrics = collector.getMetrics();

			// Assert
			expect(metrics.routing_latency.min_ms).toBe(0);
			expect(metrics.routing_latency.max_ms).toBe(990);
			expect(metrics.routing_latency.avg_ms).toBe(495);
			expect(metrics.routing_latency.p50_ms).toBeCloseTo(490, 0);
			expect(metrics.routing_latency.p95_ms).toBeCloseTo(940, 0);
		});

		test("returns empty metrics when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordRoutingLatency(100);
			collector.recordError("timeout");

			// Act
			const metrics = collector.getMetrics();

			// Assert - should all be zero/empty
			expect(metrics.routing_latency.total_samples).toBe(0);
			expect(metrics.throughput.total_requests).toBe(0);
			expect(metrics.errors.total_errors).toBe(0);
			expect(metrics.memory.current_usage_bytes).toBe(0);
			expect(metrics.match_rates.total_evaluations).toBe(0);
		});
	});

	describe("getLatencyMetrics", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("returns empty metrics when no samples", () => {
			// Act
			const latency = collector.getLatencyMetrics();

			// Assert
			expect(latency.total_samples).toBe(0);
			expect(latency.min_ms).toBe(0);
			expect(latency.max_ms).toBe(0);
			expect(latency.avg_ms).toBe(0);
		});

		test("returns correct metrics with samples", () => {
			// Act
			collector.recordRoutingLatency(50);
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(150);

			const latency = collector.getLatencyMetrics();

			// Assert
			expect(latency.total_samples).toBe(3);
			expect(latency.min_ms).toBe(50);
			expect(latency.max_ms).toBe(150);
			expect(latency.avg_ms).toBe(100);
		});

		test("returns empty metrics when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordRoutingLatency(100);

			// Act
			const latency = collector.getLatencyMetrics();

			// Assert
			expect(latency.total_samples).toBe(0);
		});
	});

	describe("getThroughputMetrics", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("returns empty metrics when no requests", () => {
			// Act
			const throughput = collector.getThroughputMetrics();

			// Assert
			expect(throughput.total_requests).toBe(0);
			expect(throughput.requests_per_second).toBe(0);
			expect(throughput.requests_per_minute).toBe(0);
			expect(throughput.requests_per_hour).toBe(0);
		});

		test("counts recent requests for throughput", () => {
			// Arrange - record requests
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(100);

			// Act
			const throughput = collector.getThroughputMetrics();

			// Assert
			expect(throughput.total_requests).toBe(3);
			expect(throughput.requests_per_minute).toBe(3);
		});

		test("returns empty metrics when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordRoutingLatency(100);

			// Act
			const throughput = collector.getThroughputMetrics();

			// Assert
			expect(throughput.total_requests).toBe(0);
		});
	});

	describe("getErrorMetrics", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("returns empty metrics when no errors", () => {
			// Act
			const errors = collector.getErrorMetrics();

			// Assert
			expect(errors.total_errors).toBe(0);
			expect(errors.error_rate).toBe(0);
			expect(Object.keys(errors.errors_by_type)).toHaveLength(0);
		});

		test("returns correct error metrics", () => {
			// Act
			collector.recordRoutingLatency(100);
			collector.recordError("timeout");
			collector.recordError("connection_error");
			collector.recordError("timeout");

			const errors = collector.getErrorMetrics();

			// Assert
			expect(errors.total_errors).toBe(3);
			expect(errors.errors_by_type.timeout).toBe(2);
			expect(errors.errors_by_type.connection_error).toBe(1);
			expect(errors.error_rate).toBeCloseTo(0.75, 3); // 3/(1+3)
		});

		test("returns empty metrics when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordError("timeout");

			// Act
			const errors = collector.getErrorMetrics();

			// Assert
			expect(errors.total_errors).toBe(0);
		});
	});

	describe("getMemoryMetrics", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("returns empty metrics when no memory data", () => {
			// Act
			const memory = collector.getMemoryMetrics();

			// Assert
			expect(memory.current_usage_bytes).toBe(0);
			expect(memory.peak_usage_bytes).toBe(0);
			expect(memory.leak_detected).toBe(false);
			expect(memory.leak_trend).toBe("stable");
		});

		test("returns current memory when recorded", () => {
			// Act
			collector.recordMemoryUsage();
			const memory = collector.getMemoryMetrics();

			// Assert
			expect(memory.current_usage_bytes).toBeGreaterThan(0);
			expect(memory.peak_usage_bytes).toBeGreaterThan(0);
		});

		test("detects memory leak trend", () => {
			// Arrange - record some memory history
			collector.recordMemoryUsage();
			collector.recordMemoryUsage();

			// Act
			const memory = collector.getMemoryMetrics();

			// Assert - with only 2 samples, trend should be stable
			expect(memory.leak_trend).toBe("stable");
			expect(memory.leak_detected).toBe(false);
		});

		test("returns empty metrics when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordMemoryUsage();

			// Act
			const memory = collector.getMemoryMetrics();

			// Assert
			expect(memory.current_usage_bytes).toBe(0);
			expect(memory.leak_detected).toBe(false);
		});
	});

	describe("getMatchRateMetrics", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("returns empty metrics when no evaluations", () => {
			// Act
			const matchRates = collector.getMatchRateMetrics();

			// Assert
			expect(matchRates.total_evaluations).toBe(0);
			expect(matchRates.successful_matches).toBe(0);
			expect(matchRates.match_rate).toBe(0);
			expect(matchRates.unmatched_requests).toBe(0);
		});

		test("returns correct match rate metrics", () => {
			// Act
			collector.recordMatchEvaluation(true);
			collector.recordMatchEvaluation(false);
			collector.recordMatchEvaluation(true);

			const matchRates = collector.getMatchRateMetrics();

			// Assert
			expect(matchRates.total_evaluations).toBe(3);
			expect(matchRates.successful_matches).toBe(2);
			expect(matchRates.match_rate).toBeCloseTo(0.667, 3);
			expect(matchRates.unmatched_requests).toBe(1);
		});

		test("returns empty metrics when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordMatchEvaluation(true);

			// Act
			const matchRates = collector.getMatchRateMetrics();

			// Assert
			expect(matchRates.total_evaluations).toBe(0);
		});
	});

	describe("getMemoryHistory", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true, 60, 5);
		});

		test("returns empty array when no data", () => {
			// Act
			const history = collector.getMemoryHistory();

			// Assert
			expect(history).toEqual([]);
		});

		test("returns all history when no limit", () => {
			// Act
			collector.recordMemoryUsage();
			collector.recordMemoryUsage();
			collector.recordMemoryUsage();

			const history = collector.getMemoryHistory();

			// Assert
			expect(history).toHaveLength(3);
			history.forEach((point) => {
				expect(point.timestamp).toBeTruthy();
				expect(point.value).toBeGreaterThan(0);
			});
		});

		test("returns limited history with limit parameter", () => {
			// Arrange
			for (let i = 0; i < 5; i++) {
				collector.recordMemoryUsage();
			}

			// Act
			const history = collector.getMemoryHistory(2);

			// Assert - should return last 2 items
			expect(history).toHaveLength(2);
		});

		test("returns empty array when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordMemoryUsage();

			// Act
			const history = collector.getMemoryHistory();

			// Assert
			expect(history).toEqual([]);
		});
	});

	describe("reset", () => {
		beforeEach(() => {
			collector = new PerformanceMetricsCollector(true);
		});

		test("resets all metrics to initial state", () => {
			// Arrange - record some data
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(200);
			collector.recordError("timeout");
			collector.recordMatchEvaluation(true);
			collector.recordMemoryUsage();

			// Act
			collector.reset();

			// Assert
			expect(collector.getSampleCount()).toBe(0);
			const metrics = collector.getMetrics();
			expect(metrics.routing_latency.total_samples).toBe(0);
			expect(metrics.throughput.total_requests).toBe(0);
			expect(metrics.errors.total_errors).toBe(0);
			expect(metrics.match_rates.total_evaluations).toBe(0);
			expect(metrics.memory.current_usage_bytes).toBe(0);
			expect(metrics.memory.peak_usage_bytes).toBe(0);
		});

		test("does nothing when already empty", () => {
			// Act & Assert - should not throw
			expect(() => collector.reset()).not.toThrow();
		});

		test("does nothing when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordRoutingLatency(100);

			// Act & Assert - should not throw
			expect(() => collector.reset()).not.toThrow();
		});
	});

	describe("isEnabled", () => {
		test("returns true when enabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(true);

			// Act & Assert
			expect(collector.isEnabled()).toBe(true);
		});

		test("returns false when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);

			// Act & Assert
			expect(collector.isEnabled()).toBe(false);
		});

		test("returns true by default", () => {
			// Act & Assert
			expect(collector.isEnabled()).toBe(true);
		});
	});

	describe("enable", () => {
		test("enables metrics collection", () => {
			// Arrange - create disabled collector
			collector = new PerformanceMetricsCollector(false);
			expect(collector.isEnabled()).toBe(false);

			// Act
			collector.enable();

			// Assert
			expect(collector.isEnabled()).toBe(true);

			// Should now record metrics
			collector.recordRoutingLatency(100);
			expect(collector.getSampleCount()).toBe(1);
		});
	});

	describe("disable", () => {
		test("disables metrics collection", () => {
			// Arrange - create enabled collector
			collector = new PerformanceMetricsCollector(true);
			expect(collector.isEnabled()).toBe(true);

			// Act
			collector.disable();

			// Assert
			expect(collector.isEnabled()).toBe(false);

			// Should not record metrics
			collector.recordRoutingLatency(100);
			expect(collector.getSampleCount()).toBe(0);
		});
	});

	describe("getSampleCount", () => {
		test("returns 0 when no samples", () => {
			// Act
			const count = collector.getSampleCount();

			// Assert
			expect(count).toBe(0);
		});

		test("returns correct sample count", () => {
			// Act
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(200);
			collector.recordRoutingLatency(300);

			const count = collector.getSampleCount();

			// Assert
			expect(count).toBe(3);
		});

		test("returns 0 when disabled", () => {
			// Arrange
			collector = new PerformanceMetricsCollector(false);
			collector.recordRoutingLatency(100);

			// Act
			const count = collector.getSampleCount();

			// Assert
			expect(count).toBe(0);
		});
	});

	describe("getUptime", () => {
		test("returns 0 immediately after creation", () => {
			// Act
			const uptime = collector.getUptime();

			// Assert
			expect(uptime).toBe(0);
		});

		test("increases over time", async () => {
			// Arrange
			const initialUptime = collector.getUptime();

			// Act - wait >1 second (uptime granularity is in seconds)
			await new Promise((resolve) => setTimeout(resolve, 1100));
			const laterUptime = collector.getUptime();

			// Assert
			expect(laterUptime).toBeGreaterThan(initialUptime);
		});

		test("resets after reset", async () => {
			// Arrange - wait >1 second (uptime granularity is in seconds)
			await new Promise((resolve) => setTimeout(resolve, 1100));
			const initialUptime = collector.getUptime();

			// Act
			collector.reset();
			const resetUptime = collector.getUptime();

			// Assert - should be less than before reset
			expect(resetUptime).toBeLessThan(initialUptime);
		});
	});

	describe("createPerformanceMetricsCollector", () => {
		test("creates collector with default parameters", () => {
			// Act
			const newCollector = createPerformanceMetricsCollector();

			// Assert
			expect(newCollector).toBeInstanceOf(PerformanceMetricsCollector);
			expect(newCollector.isEnabled()).toBe(true);
		});

		test("creates collector with custom enabled flag", () => {
			// Act
			const newCollector = createPerformanceMetricsCollector(false);

			// Assert
			expect(newCollector).toBeInstanceOf(PerformanceMetricsCollector);
			expect(newCollector.isEnabled()).toBe(false);
		});

		test("creates collector with all custom parameters", () => {
			// Act
			const newCollector = createPerformanceMetricsCollector(true, 120, 500);

			// Assert
			expect(newCollector).toBeInstanceOf(PerformanceMetricsCollector);
			const metrics = newCollector.getMetrics();
			expect(metrics.collection_window_seconds).toBe(120);
		});
	});

	describe("collection window trimming", () => {
		test("trims old samples based on collection window", async () => {
			// Arrange - create collector with 1 second window
			collector = new PerformanceMetricsCollector(true, 1);

			// Act - record some latency
			collector.recordRoutingLatency(100);
			collector.recordRoutingLatency(200);

			// Wait for window to expire
			await new Promise((resolve) => setTimeout(resolve, 1100));

			// Record new sample
			collector.recordRoutingLatency(300);

			const throughput = collector.getThroughputMetrics();

			// Assert - old samples should be trimmed, only new one counted
			expect(throughput.total_requests).toBe(1);
			expect(collector.getSampleCount()).toBeLessThanOrEqual(1);
		});
	});
});
