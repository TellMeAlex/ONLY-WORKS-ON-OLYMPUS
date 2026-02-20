/**
 * End-to-End Test for Analytics Data Flow
 *
 * Tests the complete analytics workflow:
 * 1. Enable analytics in config
 * 2. Run routing operations to generate data
 * 3. Verify data is stored
 * 4. Run 'olimpus analytics show' to display metrics
 * 5. Run 'olimpus analytics export json' to verify export
 * 6. Run 'olimpus analytics export csv' to verify export
 * 7. Verify unmatched requests are tracked
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { rmSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import {
  AnalyticsStorage,
  AnalyticsDashboard,
  exportToJson,
  exportToCsv,
  displayAnalytics,
  PerformanceMetricsCollector,
  PrometheusMetricsFormatter,
  MetricsExportServer,
} from "./index.js";
import type {
  AnalyticsEvent,
  RoutingDecisionEvent,
  UnmatchedRequestEvent,
  AnalyticsConfig,
} from "./types.js";

describe("Analytics End-to-End Data Flow", () => {
  let tempDir: string;
  let storageFilePath: string;
  let storage: AnalyticsStorage;
  let config: AnalyticsConfig;

  beforeEach(() => {
    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), "analytics-e2e-test-"));
    storageFilePath = join(tempDir, "analytics.json");

    // Create analytics config
    config = {
      enabled: true,
      storage_file: storageFilePath,
      max_events: 1000,
      retention_days: 30,
      auto_prune: false,
    };
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("Step 1: Enable analytics in config", () => {
    test("should initialize storage with enabled config", () => {
      // Act
      storage = new AnalyticsStorage(config);

      // Assert
      expect(storage.isEnabled()).toBe(true);
      expect(storage.getEventCount()).toBe(0);
      expect(existsSync(storageFilePath)).toBe(false); // No file created yet
    });

    test("should respect disabled flag in config", () => {
      // Arrange
      config.enabled = false;

      // Act
      storage = new AnalyticsStorage(config);

      // Assert
      expect(storage.isEnabled()).toBe(false);
    });
  });

  describe("Step 2: Run routing operations to generate data", () => {
    beforeEach(() => {
      storage = new AnalyticsStorage(config);
    });

    test("should record routing decision events", () => {
      // Arrange
      const routingEvent: RoutingDecisionEvent = {
        type: "routing_decision",
        timestamp: new Date().toISOString(),
        target_agent: "code-reviewer",
        matcher_type: "keyword",
        matched_content: "review this code",
        config_overrides: {
          model: "gpt-4",
          temperature: 0.7,
        },
        meta_agent: "main-router",
      };

      // Act
      storage.recordEvent(routingEvent);

      // Assert
      expect(storage.getEventCount()).toBe(1);
      const events = storage.getAllEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe("routing_decision");
    });

    test("should record unmatched request events", () => {
      // Arrange
      const unmatchedEvent: UnmatchedRequestEvent = {
        type: "unmatched_request",
        timestamp: new Date().toISOString(),
        user_request: "what is the meaning of life?",
        meta_agent: "fallback-handler",
      };

      // Act
      storage.recordEvent(unmatchedEvent);

      // Assert
      expect(storage.getEventCount()).toBe(1);
      const events = storage.getAllEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe("unmatched_request");
    });

    test("should record multiple routing operations with different agents", () => {
      // Arrange - Simulate multiple routing operations
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 10000).toISOString(),
          target_agent: "code-reviewer",
          matcher_type: "keyword",
          matched_content: "review code",
          meta_agent: "main-router",
        },
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 8000).toISOString(),
          target_agent: "debug-helper",
          matcher_type: "pattern",
          matched_content: "fix bug",
          meta_agent: "main-router",
        },
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 6000).toISOString(),
          target_agent: "code-reviewer",
          matcher_type: "keyword",
          matched_content: "check my code",
          meta_agent: "main-router",
        },
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 4000).toISOString(),
          target_agent: "documentation-writer",
          matcher_type: "pattern",
          matched_content: "write docs",
          meta_agent: "main-router",
        },
      ];

      // Act
      events.forEach((event) => storage.recordEvent(event));

      // Assert
      expect(storage.getEventCount()).toBe(4);

      // Verify agent distribution
      const agentCounts = new Map<string, number>();
      storage.getAllEvents().forEach((event) => {
        if (event.type === "routing_decision") {
          agentCounts.set(
            event.target_agent,
            (agentCounts.get(event.target_agent) || 0) + 1
          );
        }
      });

      expect(agentCounts.get("code-reviewer")).toBe(2);
      expect(agentCounts.get("debug-helper")).toBe(1);
      expect(agentCounts.get("documentation-writer")).toBe(1);
    });
  });

  describe("Step 3: Verify data is stored", () => {
    beforeEach(() => {
      storage = new AnalyticsStorage(config);

      // Record some initial data
      const event: RoutingDecisionEvent = {
        type: "routing_decision",
        timestamp: new Date().toISOString(),
        target_agent: "test-agent",
        matcher_type: "test-matcher",
        meta_agent: "test-meta",
      };
      storage.recordEvent(event);
    });

    test("should persist data to file", async () => {
      // Assert
      expect(existsSync(storageFilePath)).toBe(true);

      // Verify file contains valid JSON
      const content = await Bun.file(storageFilePath).text();
      const data = JSON.parse(content);
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.events.length).toBeGreaterThan(0);
    });

    test("should load existing data on initialization", () => {
      // Arrange - Create new storage instance with same config
      const storage2 = new AnalyticsStorage(config);

      // Assert - Should have loaded previous data
      expect(storage2.getEventCount()).toBe(1);
      expect((storage2.getAllEvents()[0]! as import("./types.js").RoutingDecisionEvent).target_agent).toBe("test-agent");
    });

    test("should export data in proper format", () => {
      // Act
      const exportedData = storage.exportData();

      // Assert
      expect(exportedData.version).toBeDefined();
      expect(exportedData.total_events).toBe(1);
      expect(exportedData.events).toHaveLength(1);
      expect(exportedData.first_event_timestamp).toBeDefined();
      expect(exportedData.last_event_timestamp).toBeDefined();
    });
  });

  describe("Step 4: Run 'olimpus analytics show' to display metrics", () => {
    beforeEach(() => {
      storage = new AnalyticsStorage(config);

      // Record sample data
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 10000).toISOString(),
          target_agent: "code-reviewer",
          matcher_type: "keyword",
          matched_content: "review this",
          meta_agent: "main-router",
        },
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 8000).toISOString(),
          target_agent: "debug-helper",
          matcher_type: "pattern",
          matched_content: "fix this bug",
          meta_agent: "main-router",
        },
        {
          type: "unmatched_request",
          timestamp: new Date(Date.now() - 6000).toISOString(),
          user_request: "unknown request",
          meta_agent: "fallback",
        },
      ];

      events.forEach((event) => storage.recordEvent(event));
    });

    test("should create dashboard and display metrics", () => {
      // Arrange
      const events = storage.getAllEvents();
      const dashboard = new AnalyticsDashboard(events);

      // Act
      const metrics = dashboard.getFormattedMetrics();

      // Assert - Summary
      expect(metrics.summary.total_events).toBe(3);
      expect(metrics.summary.routing_decisions).toBe(2);
      expect(metrics.summary.unmatched_requests).toBe(1);
      expect(metrics.summary.unique_agents).toBe(2);
      expect(metrics.summary.unique_matchers).toBe(2);

      // Assert - Top agents
      expect(metrics.top_agents).toHaveLength(2);
      expect(metrics.top_agents[0]!.name).toBe("code-reviewer");
      expect(metrics.top_agents[0]!.requests).toBe(1);

      // Assert - Top matchers
      expect(metrics.top_matchers).toHaveLength(2);

      // Assert - Unmatched requests
      expect(metrics.unmatched_requests).toHaveLength(1);
      expect(metrics.unmatched_requests[0]!.user_request).toBe("unknown request");
    });

    test("should display analytics using convenience function", () => {
      // Arrange
      const events = storage.getAllEvents();

      // Act
      const output = displayAnalytics(events);

      // Assert
      expect(output.success).toBe(true);
      expect(output.total_events).toBe(3);
      expect(output.agent_count).toBe(2);
      expect(output.unmatched_count).toBe(1);
    });

    test("should get agent details", () => {
      // Arrange
      const events = storage.getAllEvents();
      const dashboard = new AnalyticsDashboard(events);

      // Act
      const metrics = dashboard.getFormattedMetrics();
      const agentDetails = metrics.agent_details;

      // Assert
      expect(agentDetails["code-reviewer"]).toBeDefined();
      expect(agentDetails["code-reviewer"]!.total_requests).toBe(1);
      expect(agentDetails["debug-helper"]).toBeDefined();
      expect(agentDetails["debug-helper"]!.total_requests).toBe(1);
    });

    test("should get matcher details", () => {
      // Arrange
      const events = storage.getAllEvents();
      const dashboard = new AnalyticsDashboard(events);

      // Act
      const metrics = dashboard.getFormattedMetrics();
      const matcherDetails = metrics.matcher_details;

      // Assert
      expect(matcherDetails["keyword"]).toBeDefined();
      expect(matcherDetails["keyword"]!.total_evaluations).toBe(1);
      expect(matcherDetails["pattern"]).toBeDefined();
      expect(matcherDetails["pattern"]!.total_evaluations).toBe(1);
    });
  });

  describe("Step 5: Run 'olimpus analytics export json' to verify export", () => {
    beforeEach(() => {
      storage = new AnalyticsStorage(config);

      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: new Date().toISOString(),
          target_agent: "agent1",
          matcher_type: "matcher1",
          matched_content: "content1",
        },
        {
          type: "unmatched_request",
          timestamp: new Date().toISOString(),
          user_request: "request1",
        },
      ];

      events.forEach((event) => storage.recordEvent(event));
    });

    test("should export as valid JSON", () => {
      // Act
      const jsonOutput = exportToJson(storage);

      // Assert - Verify it's valid JSON
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.format).toBe("json");
      expect(parsed.version).toBeDefined();
      expect(parsed.exported_at).toBeDefined();
      expect(parsed.record_count).toBe(2);
      expect(Array.isArray(parsed.events)).toBe(true);
      expect(parsed.events.length).toBe(2);
    });

    test("should export events in JSON format", () => {
      // Act
      const jsonOutput = exportToJson(storage);
      const parsed = JSON.parse(jsonOutput);

      // Assert
      expect(parsed.events[0]!.type).toBe("routing_decision");
      expect(parsed.events[0].target_agent).toBe("agent1");
      expect(parsed.events[1].type).toBe("unmatched_request");
      expect(parsed.events[1].user_request).toBe("request1");
    });

    test("should include aggregated metrics by default", () => {
      // Act
      const jsonOutput = exportToJson(storage);
      const parsed = JSON.parse(jsonOutput);

      // Assert
      expect(parsed.metrics).toBeDefined();
      expect(parsed.metrics.total_events).toBeDefined();
      expect(parsed.metrics.agent_metrics).toBeDefined();
      expect(parsed.metrics.matcher_metrics).toBeDefined();
    });

    test("should export only events when metrics disabled", () => {
      // Act
      const jsonOutput = exportToJson(storage, { include_metrics: false });
      const parsed = JSON.parse(jsonOutput);

      // Assert
      expect(parsed.metrics).toBeUndefined();
      expect(parsed.events).toBeDefined();
      expect(parsed.events.length).toBe(2);
    });
  });

  describe("Step 6: Run 'olimpus analytics export csv' to verify export", () => {
    beforeEach(() => {
      storage = new AnalyticsStorage(config);

      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: new Date().toISOString(),
          target_agent: "agent1",
          matcher_type: "matcher1",
          matched_content: "simple content",
        },
        {
          type: "unmatched_request",
          timestamp: new Date().toISOString(),
          user_request: "request with, comma",
        },
      ];

      events.forEach((event) => storage.recordEvent(event));
    });

    test("should export as valid CSV", () => {
      // Act
      const csvOutput = exportToCsv(storage);

      // Assert
      const lines = csvOutput.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(3); // Header + 2 events

      // Verify header
      const headers = lines[0]!.split(",");
      expect(headers[0]).toBe("timestamp");
      expect(headers[1]).toBe("type");
      expect(headers[2]).toBe("target_agent");
    });

    test("should handle special characters in CSV", () => {
      // Arrange - Record event with comma in user_request
      storage.recordEvent({
        type: "unmatched_request",
        timestamp: new Date().toISOString(),
        user_request: "request with, comma and \"quotes\"",
      });

      // Act
      const csvOutput = exportToCsv(storage);

      // Assert - Verify proper CSV escaping
      expect(csvOutput).toContain('"request with, comma and ""quotes"""');
    });

    test("should export all event fields", () => {
      // Act
      const csvOutput = exportToCsv(storage);
      const lines = csvOutput.split("\n");

      // Assert - Verify routing decision event fields
      const routingLine = lines[1];
      expect(routingLine).toContain("routing_decision");
      expect(routingLine).toContain("agent1");
      expect(routingLine).toContain("matcher1");
      expect(routingLine).toContain("simple content");

      // Assert - Verify unmatched request event fields
      const unmatchedLine = lines[2];
      expect(unmatchedLine).toContain("unmatched_request");
      expect(unmatchedLine).toContain("request with, comma");
    });
  });

  describe("Step 7: Verify unmatched requests are tracked", () => {
    beforeEach(() => {
      storage = new AnalyticsStorage(config);
    });

    test("should track unmatched requests separately", () => {
      // Arrange
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: new Date().toISOString(),
          target_agent: "agent1",
          matcher_type: "matcher1",
        },
        {
          type: "unmatched_request",
          timestamp: new Date().toISOString(),
          user_request: "unknown1",
          meta_agent: "meta1",
        },
        {
          type: "routing_decision",
          timestamp: new Date().toISOString(),
          target_agent: "agent2",
          matcher_type: "matcher2",
        },
        {
          type: "unmatched_request",
          timestamp: new Date().toISOString(),
          user_request: "unknown2",
        },
      ];

      // Act
      events.forEach((event) => storage.recordEvent(event));

      // Assert
      expect(storage.getEventCount()).toBe(4);
      const unmatched = storage.getUnmatchedRequests();
      expect(unmatched).toHaveLength(2);
      expect((unmatched[0]! as import("./types.js").UnmatchedRequestEvent).user_request).toBe("unknown1");
      expect((unmatched[1]! as import("./types.js").UnmatchedRequestEvent).user_request).toBe("unknown2");
    });

    test("should include unmatched requests in dashboard", () => {
      // Arrange
      storage.recordEvent({
        type: "routing_decision",
        timestamp: new Date().toISOString(),
        target_agent: "agent1",
        matcher_type: "matcher1",
      });
      storage.recordEvent({
        type: "unmatched_request",
        timestamp: new Date().toISOString(),
        user_request: "unmatched",
        meta_agent: "fallback",
      });

      // Act
      const dashboard = new AnalyticsDashboard(storage.getAllEvents());
      const metrics = dashboard.getFormattedMetrics();

      // Assert
      expect(metrics.summary.unmatched_requests).toBe(1);
      expect(metrics.unmatched_requests).toHaveLength(1);
      expect(metrics.unmatched_requests[0]!.user_request).toBe("unmatched");
      expect(metrics.unmatched_requests[0]!.meta_agent).toBe("fallback");
    });

    test("should export unmatched requests in JSON", () => {
      // Arrange
      storage.recordEvent({
        type: "unmatched_request",
        timestamp: new Date().toISOString(),
        user_request: "test unmatched",
      });

      // Act
      const jsonOutput = exportToJson(storage);
      const parsed = JSON.parse(jsonOutput);

      // Assert
      const unmatchedEvent = parsed.events.find(
        (e: AnalyticsEvent) => e.type === "unmatched_request"
      );
      expect(unmatchedEvent).toBeDefined();
      expect(unmatchedEvent.user_request).toBe("test unmatched");
    });

    test("should export unmatched requests in CSV", () => {
      // Arrange
      storage.recordEvent({
        type: "unmatched_request",
        timestamp: "2024-01-01T00:00:00.000Z",
        user_request: "test unmatched",
      });

      // Act
      const csvOutput = exportToCsv(storage);
      const lines = csvOutput.split("\n");

      // Assert
      const unmatchedLine = lines.find((line) =>
        line.includes("unmatched_request")
      );
      expect(unmatchedLine).toBeDefined();
      expect(unmatchedLine).toContain("test unmatched");
    });
  });

  describe("Complete Workflow Test", () => {
    test("should demonstrate complete analytics data flow", () => {
      // Step 1: Enable analytics
      storage = new AnalyticsStorage(config);
      expect(storage.isEnabled()).toBe(true);

      // Step 2: Simulate routing operations
      const operations: AnalyticsEvent[] = [
        // Successful routing
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 5000).toISOString(),
          target_agent: "code-reviewer",
          matcher_type: "keyword",
          matched_content: "please review my code",
          config_overrides: { model: "gpt-4", temperature: 0.7 },
          meta_agent: "main-router",
        },
        // Another successful routing
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 4000).toISOString(),
          target_agent: "debug-helper",
          matcher_type: "pattern",
          matched_content: "I have a bug in my code",
          meta_agent: "main-router",
        },
        // Unmatched request
        {
          type: "unmatched_request",
          timestamp: new Date(Date.now() - 3000).toISOString(),
          user_request: "what's the weather like?",
          meta_agent: "fallback-handler",
        },
        // Another successful routing to same agent
        {
          type: "routing_decision",
          timestamp: new Date(Date.now() - 2000).toISOString(),
          target_agent: "code-reviewer",
          matcher_type: "keyword",
          matched_content: "review this function",
          meta_agent: "main-router",
        },
        // Another unmatched request
        {
          type: "unmatched_request",
          timestamp: new Date(Date.now() - 1000).toISOString(),
          user_request: "tell me a joke",
        },
      ];

      operations.forEach((op) => storage.recordEvent(op));

      // Step 3: Verify data is stored
      expect(storage.getEventCount()).toBe(5);
      expect(existsSync(storageFilePath)).toBe(true);

      // Step 4: Verify dashboard metrics
      const dashboard = new AnalyticsDashboard(storage.getAllEvents());
      const metrics = dashboard.getFormattedMetrics();

      expect(metrics.summary.total_events).toBe(5);
      expect(metrics.summary.routing_decisions).toBe(3);
      expect(metrics.summary.unmatched_requests).toBe(2);
      expect(metrics.summary.unique_agents).toBe(2);
      expect(metrics.summary.unique_matchers).toBe(2);

      // Step 5: Verify JSON export
      const jsonOutput = exportToJson(storage);
      const jsonParsed = JSON.parse(jsonOutput);
      expect(jsonParsed.record_count).toBe(5);
      expect(jsonParsed.events).toHaveLength(5);
      expect(jsonParsed.metrics).toBeDefined();

      // Step 6: Verify CSV export
      const csvOutput = exportToCsv(storage);
      const csvLines = csvOutput.split("\n");
      expect(csvLines[0]).toContain("timestamp,type");
      expect(csvLines.length).toBeGreaterThan(1);

      // Step 7: Verify unmatched request tracking
      const unmatched = storage.getUnmatchedRequests();
      expect(unmatched).toHaveLength(2);
      expect(metrics.unmatched_requests).toHaveLength(2);
      expect(metrics.unmatched_requests[0]!.user_request).toBe("what's the weather like?");
      expect(metrics.unmatched_requests[1]!.user_request).toBe("tell me a joke");

      // Verify agent usage is tracked correctly
      expect(metrics.top_agents[0]!.name).toBe("code-reviewer");
      expect(metrics.top_agents[0]!.requests).toBe(2);
      expect(metrics.top_agents[1]!.name).toBe("debug-helper");
      expect(metrics.top_agents[1]!.requests).toBe(1);
    });
  });
});

/**
 * End-to-end tests for performance metrics collection, Prometheus formatting, and server endpoint
 *
 * Tests the complete flow:
 * 1. Create PerformanceMetricsCollector instance
 * 2. Record sample metrics (latency, memory, match rates, errors)
 * 3. Format metrics with PrometheusMetricsFormatter
 * 4. Verify Prometheus format is valid
 * 5. Start MetricsExportServer
 * 6. Hit /metrics endpoint
 * 7. Verify response contains expected Prometheus metrics
 */

describe("End-to-End: Performance Metrics Collection and Export", () => {
  test("complete flow from collection to HTTP endpoint", async () => {
    // Step 1: Create PerformanceMetricsCollector instance
    const collector = new PerformanceMetricsCollector(true, 60, 100);
    expect(collector).toBeDefined();
    expect(collector.isEnabled()).toBe(true);

    // Step 2: Record sample metrics (latency, memory, match rates, errors)
    // Record routing latencies
    collector.recordRoutingLatency(100);
    collector.recordRoutingLatency(150);
    collector.recordRoutingLatency(125);
    collector.recordRoutingLatency(200);
    collector.recordRoutingLatency(80);

    // Record errors of different types
    collector.recordError("timeout");
    collector.recordError("connection_error");
    collector.recordError("validation_error");
    collector.recordError("timeout");

    // Record match evaluations
    collector.recordMatchEvaluation(true);
    collector.recordMatchEvaluation(true);
    collector.recordMatchEvaluation(false);
    collector.recordMatchEvaluation(true);
    collector.recordMatchEvaluation(false);

    // Record memory usage
    collector.recordMemoryUsage();

    // Verify metrics were recorded
    expect(collector.getSampleCount()).toBe(5);

    // Step 3: Get metrics from collector
    const metrics = collector.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.routing_latency.total_samples).toBe(5);
    expect(metrics.errors.total_errors).toBe(4);
    expect(metrics.match_rates.total_evaluations).toBe(5);

    // Step 4: Format metrics with PrometheusMetricsFormatter
    const formatter = new PrometheusMetricsFormatter();
    const prometheusText = formatter.format(metrics);

    // Step 5: Verify Prometheus format is valid
    expect(prometheusText).toBeDefined();
    expect(typeof prometheusText).toBe("string");
    expect(prometheusText.length).toBeGreaterThan(0);

    // Check for HELP and TYPE comments
    expect(prometheusText).toContain("# HELP");
    expect(prometheusText).toContain("# TYPE");

    // Check for metric names (latency, throughput, errors, memory, match rates)
    expect(prometheusText).toContain("routing_latency_min_milliseconds");
    expect(prometheusText).toContain("routing_latency_avg_milliseconds");
    expect(prometheusText).toContain("routing_latency_max_milliseconds");
    expect(prometheusText).toContain("routing_requests_total");
    expect(prometheusText).toContain("routing_errors_total");
    expect(prometheusText).toContain("routing_error_rate");
    expect(prometheusText).toContain("routing_memory_usage_bytes");
    expect(prometheusText).toContain("routing_match_rate");

    // Check for error type labels
    expect(prometheusText).toContain('error_type="timeout"');
    expect(prometheusText).toContain('error_type="connection_error"');
    expect(prometheusText).toContain('error_type="validation_error"');

    // Step 6: Start MetricsExportServer
    const server = new MetricsExportServer(collector, {
      port: 9090,
      metricsPath: "/metrics",
      hostname: "127.0.0.1",
    });
    await server.start();

    try {
      expect(server.isRunning()).toBe(true);
      const status = server.getStatus();
      expect(status.running).toBe(true);
      expect(status.port).toBe(9090);
      expect(status.metricsPath).toBe("/metrics");

      // Step 7: Hit /metrics endpoint
      const metricsUrl = server.getServerUrl();
      const response = await fetch(metricsUrl);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/plain; version=0.0.4; charset=utf-8");

      const responseBody = await response.text();

      // Step 8: Verify response contains expected Prometheus metrics
      expect(responseBody.length).toBeGreaterThan(0);

      // Verify HELP comments
      expect(responseBody).toContain("# HELP routing_latency_min_milliseconds");
      expect(responseBody).toContain("# HELP routing_errors_total");
      expect(responseBody).toContain("# HELP routing_match_rate");

      // Verify TYPE comments
      expect(responseBody).toContain("# TYPE routing_latency_min_milliseconds gauge");
      expect(responseBody).toContain("# TYPE routing_errors_total counter");
      expect(responseBody).toContain("# TYPE routing_requests_total counter");

      // Verify metric values
      expect(responseBody).toContain("routing_latency_min_milliseconds");
      expect(responseBody).toContain("routing_latency_avg_milliseconds");
      expect(responseBody).toContain("routing_latency_max_milliseconds");
      expect(responseBody).toContain("routing_requests_total 5");
      expect(responseBody).toContain("routing_errors_total 4");
      expect(responseBody).toContain("routing_match_evaluations_total 5");
      expect(responseBody).toContain("routing_match_successes_total 3");

      // Verify error metrics with labels
      expect(responseBody).toContain('error_type="timeout"');
      expect(responseBody).toContain('error_type="connection_error"');
      expect(responseBody).toContain('error_type="validation_error"');

      // Verify memory metrics
      expect(responseBody).toContain("routing_memory_usage_bytes");
      expect(responseBody).toContain("routing_memory_peak_bytes");

      // Verify the response from HTTP matches the formatter output
      // (Both should contain the same metric names and structure)
      const httpMetrics = responseBody.split("\n").filter((line) => line && !line.startsWith("#"));
      const formatterMetrics = prometheusText.split("\n").filter((line) => line && !line.startsWith("#"));
      expect(httpMetrics.length).toBe(formatterMetrics.length);
    } finally {
      // Clean up: stop server
      await server.stop();
      expect(server.isRunning()).toBe(false);
    }
  });

  test("server with custom formatter options", async () => {
    // Arrange
    const collector = new PerformanceMetricsCollector();
    collector.recordRoutingLatency(50);
    collector.recordRoutingLatency(75);

    const server = new MetricsExportServer(collector, {
      port: 9091,
      formatterOptions: {
        includeHelp: false,
        includeType: false,
        includeTimestamp: false,
        metricPrefix: "custom_",
      },
    });
    await server.start();

    try {
      // Act
      const response = await fetch("http://127.0.0.1:9091/metrics");
      const responseBody = await response.text();

      // Assert
      expect(responseBody).not.toContain("# HELP");
      expect(responseBody).not.toContain("# TYPE");
      expect(responseBody).toContain("custom_latency_min_milliseconds");
      expect(responseBody).toContain("custom_requests_total");
      expect(responseBody).not.toContain("routing_");

      // Without timestamps, lines should have only metric name and value
      const lines = responseBody.split("\n").filter((line) => line && !line.startsWith("#"));
      for (const line of lines) {
        const parts = line.trim().split(" ");
        expect(parts.length).toBe(2);
      }
    } finally {
      await server.stop();
    }
  });

  test("health endpoint works correctly", async () => {
    // Arrange
    const collector = new PerformanceMetricsCollector();
    const server = new MetricsExportServer(collector, { port: 9092 });
    await server.start();

    try {
      // Act
      const response = await fetch("http://127.0.0.1:9092/health");
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(body.status).toBe("healthy");
      expect(body.uptime).toBeGreaterThanOrEqual(0);
      expect(body.timestamp).toBeTruthy();
    } finally {
      await server.stop();
    }
  });

  test("root endpoint returns usage information", async () => {
    // Arrange
    const collector = new PerformanceMetricsCollector();
    const server = new MetricsExportServer(collector, { port: 9093 });
    await server.start();

    try {
      // Act
      const response = await fetch("http://127.0.0.1:9093/");
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.name).toBe("MetricsExportServer");
      expect(body.version).toBe("1.0.0");
      expect(body.endpoints.metrics).toBe("/metrics");
      expect(body.endpoints.health).toBe("/health");
      expect(body.status).toBeDefined();
      expect(body.prometheus).toBeDefined();
    } finally {
      await server.stop();
    }
  });

  test("404 for unknown endpoints", async () => {
    // Arrange
    const collector = new PerformanceMetricsCollector();
    const server = new MetricsExportServer(collector, { port: 9094 });
    await server.start();

    try {
      // Act
      const response = await fetch("http://127.0.0.1:9094/unknown");

      // Assert
      expect(response.status).toBe(404);
    } finally {
      await server.stop();
    }
  });

  test("405 for non-GET requests to metrics endpoint", async () => {
    // Arrange
    const collector = new PerformanceMetricsCollector();
    const server = new MetricsExportServer(collector, { port: 9095 });
    await server.start();

    try {
      // Act
      const response = await fetch("http://127.0.0.1:9095/metrics", {
        method: "POST",
      });

      // Assert
      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("GET");
    } finally {
      await server.stop();
    }
  });

  test("disabled collector returns empty metrics", async () => {
    // Arrange
    const collector = new PerformanceMetricsCollector(false);
    // Try to record metrics (should be ignored)
    collector.recordRoutingLatency(100);
    collector.recordError("test_error");

    const formatter = new PrometheusMetricsFormatter();
    const metrics = collector.getMetrics();

    // Act
    const prometheusText = formatter.format(metrics);

    // Assert - all values should be zero
    expect(prometheusText).toContain("routing_latency_samples_total 0");
    expect(prometheusText).toContain("routing_requests_total 0");
    expect(prometheusText).toContain("routing_errors_total 0");
    expect(prometheusText).toContain("routing_match_evaluations_total 0");
    expect(prometheusText).toContain("routing_memory_usage_bytes 0");
  });

  test("handles empty metrics", () => {
    // Arrange - collector with no data
    const collector = new PerformanceMetricsCollector();
    const formatter = new PrometheusMetricsFormatter();
    const metrics = collector.getMetrics();

    // Act
    const prometheusText = formatter.format(metrics);

    // Assert - should produce valid Prometheus output with zeros
    expect(prometheusText).toBeDefined();
    expect(prometheusText).toContain("# HELP");
    expect(prometheusText).toContain("# TYPE");
    expect(prometheusText).toContain("routing_latency_samples_total 0");
    expect(prometheusText).toContain("routing_requests_total 0");
    expect(prometheusText).toContain("routing_errors_total 0");
  });
});
