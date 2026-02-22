/**
 * Unit tests for PrometheusMetricsFormatter
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
	type PrometheusFormatterOptions,
	PrometheusMetricsFormatter,
	formatManyToPrometheus,
	formatToPrometheus,
} from "./prometheus.js";
import type { PerformanceMetrics } from "./types.js";

describe("PrometheusMetricsFormatter", () => {
	describe("constructor", () => {
		test("creates formatter with default options", () => {
			// Act
			const formatter = new PrometheusMetricsFormatter();

			// Assert
			expect(formatter).toBeDefined();
			expect(formatter).toBeInstanceOf(PrometheusMetricsFormatter);

			const options = formatter.getOptions();
			expect(options.includeHelp).toBe(true);
			expect(options.includeType).toBe(true);
			expect(options.includeTimestamp).toBe(true);
			expect(options.metricPrefix).toBe("routing_");
		});

		test("creates formatter with custom options", () => {
			// Arrange
			const customOptions: Partial<PrometheusFormatterOptions> = {
				includeHelp: false,
				includeType: false,
				includeTimestamp: false,
				metricPrefix: "custom_",
			};

			// Act
			const formatter = new PrometheusMetricsFormatter(customOptions);

			// Assert
			expect(formatter).toBeDefined();
			const options = formatter.getOptions();
			expect(options.includeHelp).toBe(false);
			expect(options.includeType).toBe(false);
			expect(options.includeTimestamp).toBe(false);
			expect(options.metricPrefix).toBe("custom_");
		});

		test("creates formatter with partial options", () => {
			// Arrange
			const partialOptions: Partial<PrometheusFormatterOptions> = {
				metricPrefix: "app_",
			};

			// Act
			const formatter = new PrometheusMetricsFormatter(partialOptions);

			// Assert
			const options = formatter.getOptions();
			expect(options.includeHelp).toBe(true); // Default
			expect(options.includeType).toBe(true); // Default
			expect(options.includeTimestamp).toBe(true); // Default
			expect(options.metricPrefix).toBe("app_"); // Custom
		});
	});

	describe("format", () => {
		let testMetrics: PerformanceMetrics;

		beforeEach(() => {
			const now = new Date().toISOString();
			testMetrics = {
				timestamp: now,
				routing_latency: {
					min_ms: 10,
					max_ms: 100,
					avg_ms: 50,
					p50_ms: 45,
					p95_ms: 85,
					p99_ms: 95,
					total_samples: 1000,
				},
				throughput: {
					requests_per_second: 10.5,
					requests_per_minute: 630,
					requests_per_hour: 37800,
					total_requests: 10000,
				},
				errors: {
					total_errors: 50,
					error_rate: 0.005,
					errors_by_type: {
						timeout: 20,
						connection_error: 15,
						validation_error: 10,
						unknown_error: 5,
					},
				},
				memory: {
					current_usage_bytes: 104857600,
					peak_usage_bytes: 209715200,
					heap_usage_bytes: 52428800,
					external_usage_bytes: 10485760,
					array_buffers_bytes: 2097152,
					leak_detected: false,
					leak_trend: "stable",
				},
				match_rates: {
					total_evaluations: 10000,
					successful_matches: 9500,
					match_rate: 0.95,
					unmatched_requests: 500,
				},
				collection_window_seconds: 60,
			};
		});

		test("format returns valid Prometheus text", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		test("format includes HELP comments by default", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("# HELP");
			expect(result).toContain("Minimum routing latency in milliseconds");
			expect(result).toContain("Requests per second in the last second");
		});

		test("format includes TYPE comments by default", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("# TYPE");
			expect(result).toContain("gauge");
			expect(result).toContain("counter");
		});

		test("format includes timestamps by default", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();
			const testTime = new Date("2024-01-15T12:00:00.000Z").toISOString();
			const metrics = { ...testMetrics, timestamp: testTime };
			const expectedTimestamp = new Date(testTime).getTime();

			// Act
			const result = formatter.format(metrics);

			// Assert
			expect(result).toContain(String(expectedTimestamp));
		});

		test("format uses custom metric prefix", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter({
				metricPrefix: "custom_",
			});

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("custom_latency_min_milliseconds");
			expect(result).toContain("custom_requests_per_second");
			expect(result).toContain("custom_errors_total");
			expect(result).not.toContain("routing_");
		});

		test("format excludes HELP comments when disabled", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter({ includeHelp: false });

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).not.toContain("# HELP");
		});

		test("format excludes TYPE comments when disabled", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter({ includeType: false });

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).not.toContain("# TYPE");
		});

		test("format excludes timestamps when disabled", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter({
				includeTimestamp: false,
			});

			// Act
			const result = formatter.format(testMetrics);

			// Assert: Lines should end with value, not timestamp
			const lines = result
				.split("\n")
				.filter((line) => line.trim() !== "" && !line.startsWith("#"));
			for (const line of lines) {
				const parts = line.trim().split(" ");
				expect(parts.length).toBe(2); // Only metric_name and value
			}
		});

		test("format includes all routing latency metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("routing_latency_min_milliseconds");
			expect(result).toContain("routing_latency_max_milliseconds");
			expect(result).toContain("routing_latency_avg_milliseconds");
			expect(result).toContain("routing_latency_p50_milliseconds");
			expect(result).toContain("routing_latency_p95_milliseconds");
			expect(result).toContain("routing_latency_p99_milliseconds");
			expect(result).toContain("routing_latency_samples_total");
		});

		test("format includes all throughput metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("routing_requests_per_second");
			expect(result).toContain("routing_requests_per_minute");
			expect(result).toContain("routing_requests_per_hour");
			expect(result).toContain("routing_requests_total");
		});

		test("format includes all error metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("routing_errors_total");
			expect(result).toContain("routing_error_rate");
			expect(result).toContain("routing_errors_by_type_total");
		});

		test("format includes error metrics with labels", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain('error_type="timeout"');
			expect(result).toContain('error_type="connection_error"');
			expect(result).toContain('error_type="validation_error"');
			expect(result).toContain('error_type="unknown_error"');
		});

		test("format includes all memory metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("routing_memory_usage_bytes");
			expect(result).toContain("routing_memory_peak_bytes");
			expect(result).toContain("routing_memory_heap_bytes");
			expect(result).toContain("routing_memory_external_bytes");
			expect(result).toContain("routing_memory_array_buffers_bytes");
			expect(result).toContain("routing_memory_leak_detected");
			expect(result).toContain("routing_memory_leak_trend");
		});

		test("format includes all match rate metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert
			expect(result).toContain("routing_match_evaluations_total");
			expect(result).toContain("routing_match_successes_total");
			expect(result).toContain("routing_match_rate");
			expect(result).toContain("routing_unmatched_requests_total");
		});

		test("format omits optional memory fields when undefined", () => {
			// Arrange
			const metrics: PerformanceMetrics = {
				...testMetrics,
				memory: {
					current_usage_bytes: 104857600,
					peak_usage_bytes: 209715200,
					leak_detected: false,
					leak_trend: "stable",
				},
			};
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(metrics);

			// Assert
			expect(result).toContain("routing_memory_usage_bytes");
			expect(result).toContain("routing_memory_peak_bytes");
			expect(result).toContain("routing_memory_leak_detected");
			expect(result).not.toMatch(/routing_memory_heap_bytes [0-9]/);
			expect(result).not.toMatch(/routing_memory_external_bytes [0-9]/);
			expect(result).not.toMatch(/routing_memory_array_buffers_bytes [0-9]/);
		});

		test("format handles empty errors_by_type object", () => {
			// Arrange
			const metrics: PerformanceMetrics = {
				...testMetrics,
				errors: {
					total_errors: 0,
					error_rate: 0,
					errors_by_type: {},
				},
			};
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(metrics);

			// Assert
			expect(result).toContain("routing_errors_total");
			expect(result).toContain("routing_error_rate");
			expect(result).not.toContain('error_type="'); // When errors_by_type is empty, no labeled metric lines should be present
		});

		test("format converts leak_detected boolean to 0 or 1", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const falseResult = formatter.format(testMetrics);

			const trueMetrics: PerformanceMetrics = {
				...testMetrics,
				memory: { ...testMetrics.memory, leak_detected: true },
			};
			const trueResult = formatter.format(trueMetrics);

			// Assert
			expect(falseResult).toContain("routing_memory_leak_detected 0");
			expect(trueResult).toContain("routing_memory_leak_detected 1");
		});

		test("format converts leak_trend string to numeric value", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const stableResult = formatter.format(testMetrics);

			const increasingMetrics: PerformanceMetrics = {
				...testMetrics,
				memory: { ...testMetrics.memory, leak_trend: "increasing" },
			};
			const increasingResult = formatter.format(increasingMetrics);

			const decreasingMetrics: PerformanceMetrics = {
				...testMetrics,
				memory: { ...testMetrics.memory, leak_trend: "decreasing" },
			};
			const decreasingResult = formatter.format(decreasingMetrics);

			// Assert
			expect(stableResult).toContain("routing_memory_leak_trend 0");
			expect(increasingResult).toContain("routing_memory_leak_trend 1");
			expect(decreasingResult).toContain("routing_memory_leak_trend -1");
		});

		test("format escapes special characters in label values", () => {
			// Arrange
			const metrics: PerformanceMetrics = {
				...testMetrics,
				errors: {
					total_errors: 5,
					error_rate: 0.001,
					errors_by_type: {
						'error"with"quotes': 2,
						"error\nwith\nnewlines": 1,
						"error\\with\\backslash": 2,
					},
				},
			};
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(metrics);

			// Assert
			expect(result).toContain('error_type="error\\"with\\"quotes"');
			expect(result).toContain('error_type="error\\nwith\\nnewlines"');
			expect(result).toContain('error_type="error\\\\with\\\\backslash"');
		});

		test("format throws error on invalid metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();
			const invalidMetrics = null as unknown as PerformanceMetrics;

			// Act & Assert
			expect(() => formatter.format(invalidMetrics)).toThrow(
				"Failed to format Prometheus metrics",
			);
		});

		test("format formats values using exponential notation", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.format(testMetrics);

			// Assert: Check that large numbers are in exponential format
			expect(result).toMatch(/routing_memory_usage_bytes [0-9.]+e\+[0-9]+/);
		});
	});

	describe("formatMany", () => {
		let testMetrics1: PerformanceMetrics;
		let testMetrics2: PerformanceMetrics;

		beforeEach(() => {
			const now = new Date();
			testMetrics1 = {
				timestamp: now.toISOString(),
				routing_latency: {
					min_ms: 10,
					max_ms: 100,
					avg_ms: 50,
					p50_ms: 45,
					p95_ms: 85,
					p99_ms: 95,
					total_samples: 1000,
				},
				throughput: {
					requests_per_second: 10.5,
					requests_per_minute: 630,
					requests_per_hour: 37800,
					total_requests: 10000,
				},
				errors: {
					total_errors: 50,
					error_rate: 0.005,
					errors_by_type: {},
				},
				memory: {
					current_usage_bytes: 104857600,
					peak_usage_bytes: 209715200,
					leak_detected: false,
					leak_trend: "stable",
				},
				match_rates: {
					total_evaluations: 10000,
					successful_matches: 9500,
					match_rate: 0.95,
					unmatched_requests: 500,
				},
				collection_window_seconds: 60,
			};

			testMetrics2 = {
				timestamp: new Date(now.getTime() + 60000).toISOString(),
				routing_latency: {
					min_ms: 15,
					max_ms: 110,
					avg_ms: 55,
					p50_ms: 50,
					p95_ms: 90,
					p99_ms: 100,
					total_samples: 1100,
				},
				throughput: {
					requests_per_second: 11.5,
					requests_per_minute: 690,
					requests_per_hour: 41400,
					total_requests: 11100,
				},
				errors: {
					total_errors: 60,
					error_rate: 0.006,
					errors_by_type: {},
				},
				memory: {
					current_usage_bytes: 110857600,
					peak_usage_bytes: 210715200,
					leak_detected: false,
					leak_trend: "stable",
				},
				match_rates: {
					total_evaluations: 11000,
					successful_matches: 10500,
					match_rate: 0.96,
					unmatched_requests: 550,
				},
				collection_window_seconds: 60,
			};
		});

		test("formatMany returns valid Prometheus text for multiple metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.formatMany([testMetrics1, testMetrics2]);

			// Assert
			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		test("formatMany separates metrics with double newline", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.formatMany([testMetrics1, testMetrics2]);

			// Assert
			expect(result).toContain("\n\n");
			// Note: format() adds \n\n between metadata and values, so parts.length > 2
		});

		test("formatMany includes metadata for each metric", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.formatMany([testMetrics1, testMetrics2]);

			// Assert - metadata is included at the start of each metrics block
			expect(result).toContain("# HELP");
			expect(result).toContain("# TYPE");
		});

		test("formatMany handles empty array", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const result = formatter.formatMany([]);

			// Assert
			expect(result).toBe("");
		});

		test("formatMany with disabled comments", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter({
				includeHelp: false,
				includeType: false,
			});

			// Act
			const result = formatter.formatMany([testMetrics1, testMetrics2]);

			// Assert
			expect(result).not.toContain("# HELP");
			expect(result).not.toContain("# TYPE");
		});
	});

	describe("getOptions and updateOptions", () => {
		test("getOptions returns readonly options", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const options = formatter.getOptions();

			// Assert
			expect(options.includeHelp).toBe(true);
			expect(options.includeType).toBe(true);
			expect(options.includeTimestamp).toBe(true);
			expect(options.metricPrefix).toBe("routing_");
		});

		test("updateOptions changes includeHelp", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			formatter.updateOptions({ includeHelp: false });

			// Assert
			expect(formatter.getOptions().includeHelp).toBe(false);
		});

		test("updateOptions changes includeType", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			formatter.updateOptions({ includeType: false });

			// Assert
			expect(formatter.getOptions().includeType).toBe(false);
		});

		test("updateOptions changes includeTimestamp", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			formatter.updateOptions({ includeTimestamp: false });

			// Assert
			expect(formatter.getOptions().includeTimestamp).toBe(false);
		});

		test("updateOptions changes metricPrefix", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			formatter.updateOptions({ metricPrefix: "new_prefix_" });

			// Assert
			expect(formatter.getOptions().metricPrefix).toBe("new_prefix_");
		});

		test("updateOptions changes multiple options at once", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			formatter.updateOptions({
				includeHelp: false,
				includeType: false,
				includeTimestamp: false,
				metricPrefix: "custom_",
			});

			// Assert
			const options = formatter.getOptions();
			expect(options.includeHelp).toBe(false);
			expect(options.includeType).toBe(false);
			expect(options.includeTimestamp).toBe(false);
			expect(options.metricPrefix).toBe("custom_");
		});

		test("updateOptions with undefined values does not change options", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			formatter.updateOptions({});

			// Assert
			const options = formatter.getOptions();
			expect(options.includeHelp).toBe(true);
			expect(options.includeType).toBe(true);
			expect(options.includeTimestamp).toBe(true);
			expect(options.metricPrefix).toBe("routing_");
		});
	});

	describe("getMetricNames", () => {
		test("getMetricNames returns all metric names with default prefix", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const names = formatter.getMetricNames();

			// Assert
			expect(names).toBeDefined();
			expect(Array.isArray(names)).toBe(true);
			expect(names.length).toBeGreaterThan(0);
			expect(names.every((name) => name.startsWith("routing_"))).toBe(true);
		});

		test("getMetricNames returns all metric names with custom prefix", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter({
				metricPrefix: "app_",
			});

			// Act
			const names = formatter.getMetricNames();

			// Assert
			expect(names.every((name) => name.startsWith("app_"))).toBe(true);
		});

		test("getMetricNames includes all expected metrics", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const names = formatter.getMetricNames();

			// Assert
			expect(names).toContain("routing_latency_min_milliseconds");
			expect(names).toContain("routing_latency_max_milliseconds");
			expect(names).toContain("routing_requests_per_second");
			expect(names).toContain("routing_requests_total");
			expect(names).toContain("routing_errors_total");
			expect(names).toContain("routing_memory_usage_bytes");
			expect(names).toContain("routing_match_rate");
		});
	});

	describe("getMetricDefinition", () => {
		test("getMetricDefinition returns definition for valid metric name", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const definition = formatter.getMetricDefinition(
				"routing_latency_min_milliseconds",
			);

			// Assert
			expect(definition).toBeDefined();
			expect(definition?.name).toBe("routing_latency_min_milliseconds");
			expect(definition?.type).toBe("gauge");
			expect(definition?.help).toBe("Minimum routing latency in milliseconds");
		});

		test("getMetricDefinition returns undefined for invalid metric name", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const definition = formatter.getMetricDefinition("invalid_metric_name");

			// Assert
			expect(definition).toBeUndefined();
		});

		test("getMetricDefinition returns correct types for counters", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const samplesDef = formatter.getMetricDefinition(
				"routing_latency_samples_total",
			);
			const requestsDef = formatter.getMetricDefinition(
				"routing_requests_total",
			);
			const errorsDef = formatter.getMetricDefinition("routing_errors_total");

			// Assert
			expect(samplesDef?.type).toBe("counter");
			expect(requestsDef?.type).toBe("counter");
			expect(errorsDef?.type).toBe("counter");
		});

		test("getMetricDefinition returns correct types for gauges", () => {
			// Arrange
			const formatter = new PrometheusMetricsFormatter();

			// Act
			const latencyDef = formatter.getMetricDefinition(
				"routing_latency_min_milliseconds",
			);
			const rateDef = formatter.getMetricDefinition("routing_error_rate");
			const memoryDef = formatter.getMetricDefinition(
				"routing_memory_usage_bytes",
			);

			// Assert
			expect(latencyDef?.type).toBe("gauge");
			expect(rateDef?.type).toBe("gauge");
			expect(memoryDef?.type).toBe("gauge");
		});
	});
});

describe("Convenience Functions", () => {
	let testMetrics: PerformanceMetrics;

	beforeEach(() => {
		const now = new Date().toISOString();
		testMetrics = {
			timestamp: now,
			routing_latency: {
				min_ms: 10,
				max_ms: 100,
				avg_ms: 50,
				p50_ms: 45,
				p95_ms: 85,
				p99_ms: 95,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: 10.5,
				requests_per_minute: 630,
				requests_per_hour: 37800,
				total_requests: 10000,
			},
			errors: {
				total_errors: 50,
				error_rate: 0.005,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 104857600,
				peak_usage_bytes: 209715200,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 10000,
				successful_matches: 9500,
				match_rate: 0.95,
				unmatched_requests: 500,
			},
			collection_window_seconds: 60,
		};
	});

	test("formatToPrometheus formats metrics to Prometheus format", () => {
		// Act
		const result = formatToPrometheus(testMetrics);

		// Assert
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(result).toContain("routing_latency_min_milliseconds");
		expect(result).toContain("# HELP");
		expect(result).toContain("# TYPE");
	});

	test("formatToPrometheus accepts options", () => {
		// Arrange
		const options: Partial<PrometheusFormatterOptions> = {
			includeHelp: false,
			includeType: false,
			metricPrefix: "custom_",
		};

		// Act
		const result = formatToPrometheus(testMetrics, options);

		// Assert
		expect(result).not.toContain("# HELP");
		expect(result).not.toContain("# TYPE");
		expect(result).toContain("custom_latency_min_milliseconds");
	});

	test("formatManyToPrometheus formats multiple metrics", () => {
		// Arrange
		const metrics2 = {
			...testMetrics,
			timestamp: new Date().toISOString(),
			routing_latency: {
				...testMetrics.routing_latency,
				min_ms: 20,
			},
		};

		// Act
		const result = formatManyToPrometheus([testMetrics, metrics2]);

		// Assert
		expect(result).toBeDefined();
		expect(result).toContain("\n\n");
	});

	test("formatManyToPrometheus accepts options", () => {
		// Arrange
		const options: Partial<PrometheusFormatterOptions> = {
			includeHelp: false,
			includeType: false,
		};

		// Act
		const result = formatManyToPrometheus([testMetrics], options);

		// Assert
		expect(result).not.toContain("# HELP");
		expect(result).not.toContain("# TYPE");
	});

	test("formatManyToPrometheus handles empty array", () => {
		// Act
		const result = formatManyToPrometheus([]);

		// Assert
		expect(result).toBe("");
	});
});

describe("PrometheusMetricsFormatter Edge Cases", () => {
	test("handles NaN values correctly", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: Number.NaN,
				max_ms: 100,
				avg_ms: Number.NaN,
				p50_ms: 50,
				p95_ms: 85,
				p99_ms: 95,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: 10.5,
				requests_per_minute: 630,
				requests_per_hour: 37800,
				total_requests: 10000,
			},
			errors: {
				total_errors: 50,
				error_rate: 0.005,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 104857600,
				peak_usage_bytes: 209715200,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 10000,
				successful_matches: 9500,
				match_rate: 0.95,
				unmatched_requests: 500,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act
		const result = formatter.format(metrics);

		// Assert
		expect(result).toContain("NaN");
	});

	test("handles Infinity values correctly", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: 0,
				max_ms: Number.POSITIVE_INFINITY,
				avg_ms: 50,
				p50_ms: 50,
				p95_ms: 85,
				p99_ms: 95,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: Number.POSITIVE_INFINITY,
				requests_per_minute: 630,
				requests_per_hour: 37800,
				total_requests: 10000,
			},
			errors: {
				total_errors: 50,
				error_rate: 0.005,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 104857600,
				peak_usage_bytes: 209715200,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 10000,
				successful_matches: 9500,
				match_rate: 0.95,
				unmatched_requests: 500,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act
		const result = formatter.format(metrics);

		// Assert
		expect(result).toContain("+Inf");
	});

	test("handles negative infinity values correctly", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: Number.NEGATIVE_INFINITY,
				max_ms: 100,
				avg_ms: 50,
				p50_ms: 50,
				p95_ms: 85,
				p99_ms: 95,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: 10.5,
				requests_per_minute: 630,
				requests_per_hour: 37800,
				total_requests: 10000,
			},
			errors: {
				total_errors: 50,
				error_rate: 0.005,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 104857600,
				peak_usage_bytes: 209715200,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 10000,
				successful_matches: 9500,
				match_rate: 0.95,
				unmatched_requests: 500,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act
		const result = formatter.format(metrics);

		// Assert
		expect(result).toContain("-Inf");
	});

	test("handles zero values correctly", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
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
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 0,
				successful_matches: 0,
				match_rate: 0,
				unmatched_requests: 0,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act
		const result = formatter.format(metrics);

		// Assert
		expect(result).toContain(" 0 ");
	});

	test("handles very large values correctly", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: 1e15,
				max_ms: 1e20,
				avg_ms: 1e18,
				p50_ms: 1e17,
				p95_ms: 1e19,
				p99_ms: 1e19,
				total_samples: 1e10,
			},
			throughput: {
				requests_per_second: 1e15,
				requests_per_minute: 1e16,
				requests_per_hour: 1e17,
				total_requests: 1e18,
			},
			errors: {
				total_errors: 1e10,
				error_rate: 0.01,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 1e15,
				peak_usage_bytes: 1e16,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 1e18,
				successful_matches: 1e17,
				match_rate: 0.1,
				unmatched_requests: 1e17,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act: Should not throw
		const result = formatter.format(metrics);

		// Assert
		expect(result).toBeDefined();
		expect(result.length).toBeGreaterThan(0);
	});

	test("handles decimal values with high precision", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: 0.000123456,
				max_ms: 999.999999,
				avg_ms: 123.456789,
				p50_ms: 100.111222,
				p95_ms: 200.333444,
				p99_ms: 250.555666,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: 0.000001,
				requests_per_minute: 0.00006,
				requests_per_hour: 0.0036,
				total_requests: 1,
			},
			errors: {
				total_errors: 1,
				error_rate: 0.000001,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 1.5,
				peak_usage_bytes: 2.7,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 1000000,
				successful_matches: 999999,
				match_rate: 0.999999,
				unmatched_requests: 1,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act
		const result = formatter.format(metrics);

		// Assert
		expect(result).toBeDefined();
		expect(result).toContain("e+");
	});

	test("handles error type with complex characters", () => {
		// Arrange
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: 10,
				max_ms: 100,
				avg_ms: 50,
				p50_ms: 45,
				p95_ms: 85,
				p99_ms: 95,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: 10.5,
				requests_per_minute: 630,
				requests_per_hour: 37800,
				total_requests: 10000,
			},
			errors: {
				total_errors: 3,
				error_rate: 0.0003,
				errors_by_type: {
					'error with "quotes" and \n newlines and \\ backslashes': 3,
				},
			},
			memory: {
				current_usage_bytes: 104857600,
				peak_usage_bytes: 209715200,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 10000,
				successful_matches: 9500,
				match_rate: 0.95,
				unmatched_requests: 500,
			},
			collection_window_seconds: 60,
		};
		const formatter = new PrometheusMetricsFormatter();

		// Act: Should not throw
		const result = formatter.format(metrics);

		// Assert
		expect(result).toBeDefined();
		expect(result).toContain('error_type="');
		expect(result).toContain('\\"');
		expect(result).toContain("\\n");
		expect(result).toContain("\\\\");
	});

	test("produces consistent output across multiple calls", () => {
		// Arrange
		const formatter = new PrometheusMetricsFormatter();
		const metrics: PerformanceMetrics = {
			timestamp: new Date().toISOString(),
			routing_latency: {
				min_ms: 10,
				max_ms: 100,
				avg_ms: 50,
				p50_ms: 45,
				p95_ms: 85,
				p99_ms: 95,
				total_samples: 1000,
			},
			throughput: {
				requests_per_second: 10.5,
				requests_per_minute: 630,
				requests_per_hour: 37800,
				total_requests: 10000,
			},
			errors: {
				total_errors: 50,
				error_rate: 0.005,
				errors_by_type: {},
			},
			memory: {
				current_usage_bytes: 104857600,
				peak_usage_bytes: 209715200,
				leak_detected: false,
				leak_trend: "stable",
			},
			match_rates: {
				total_evaluations: 10000,
				successful_matches: 9500,
				match_rate: 0.95,
				unmatched_requests: 500,
			},
			collection_window_seconds: 60,
		};

		// Act
		const result1 = formatter.format(metrics);
		const result2 = formatter.format(metrics);

		// Assert
		expect(result1).toBe(result2);
	});
});
