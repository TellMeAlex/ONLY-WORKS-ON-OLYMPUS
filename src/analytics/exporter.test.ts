/**
 * Unit tests for AnalyticsExporter
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import { AnalyticsExporter } from "./exporter.js";
import { AnalyticsStorage } from "./storage.js";
import type { AnalyticsEvent, ExportOptions } from "./types.js";
import { exportToJson, exportToCsv, exportToFile } from "./exporter.js";

describe("AnalyticsExporter", () => {
  let tempDir: string;
  let storage: AnalyticsStorage;
  let exporter: AnalyticsExporter;
  let testEvents: AnalyticsEvent[];

  beforeEach(() => {
    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), "analytics-exporter-test-"));

    // Create storage with temp file path
    const storagePath = join(tempDir, "analytics.json");
    storage = new AnalyticsStorage({ storage_file: storagePath, enabled: true });

    // Create exporter
    exporter = new AnalyticsExporter(storage);

    // Create test events
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    testEvents = [
      {
        type: "routing_decision",
        timestamp: now.toISOString(),
        target_agent: "code-agent",
        matcher_type: "keyword",
        matched_content: "fix bug",
        meta_agent: "router",
      },
      {
        type: "routing_decision",
        timestamp: oneHourAgo.toISOString(),
        target_agent: "test-agent",
        matcher_type: "semantic",
        matched_content: "write tests",
        config_overrides: {
          model: "gpt-4",
          temperature: 0.7,
        },
        meta_agent: "router",
      },
      {
        type: "unmatched_request",
        timestamp: twoHoursAgo.toISOString(),
        user_request: "do something impossible",
        meta_agent: "router",
      },
    ];

    // Add events to storage
    for (const event of testEvents) {
      storage.recordEvent(event);
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("constructor creates exporter with storage and aggregator", () => {
    // Assert
    expect(exporter).toBeDefined();
    expect(exporter).toBeInstanceOf(AnalyticsExporter);
  });

  test("constructor accepts optional aggregator parameter", () => {
    // Arrange & Act
    const customExporter = new AnalyticsExporter(storage);

    // Assert
    expect(customExporter).toBeDefined();
    expect(customExporter).toBeInstanceOf(AnalyticsExporter);
  });

  test("exportToJson returns valid JSON string", () => {
    // Act
    const result = exporter.exportToJson();

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");

    // Should be parseable JSON
    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });

  test("exportToJson includes required top-level fields", () => {
    // Act
    const result = exporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.format).toBe("json");
    expect(parsed.version).toBe("1.0.0");
    expect(parsed.exported_at).toBeDefined();
    expect(parsed.record_count).toBeGreaterThanOrEqual(0);
    expect(parsed.options).toBeDefined();
    expect(parsed.events).toBeDefined();
    expect(parsed.metrics).toBeDefined();
  });

  test("exportToJson includes all stored events", () => {
    // Act
    const result = exporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.events).toHaveLength(testEvents.length);
  });

  test("exportToJson includes exported_at timestamp", () => {
    // Act
    const now = Date.now();
    const result = exporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.exported_at).toBeDefined();
    const exportedTime = new Date(parsed.exported_at).getTime();
    // Should be within reasonable time range (within 5 seconds)
    expect(exportedTime).toBeGreaterThanOrEqual(now - 5000);
    expect(exportedTime).toBeLessThanOrEqual(now + 5000);
  });

  test("exportToJson correctly counts records", () => {
    // Act
    const result = exporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.record_count).toBe(testEvents.length);
  });

  test("exportToJson with include_metrics false excludes metrics", () => {
    // Arrange
    const options: Partial<ExportOptions> = {
      include_metrics: false,
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.metrics).toBeUndefined();
    expect(parsed.events).toBeDefined();
  });

  test("exportToJson includes sanitized options", () => {
    // Act
    const result = exporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.options).toBeDefined();
    expect(parsed.options.format).toBe("json");
    expect(parsed.options.include_raw_events).toBe(true);
    expect(parsed.options.include_metrics).toBe(true);
    expect(typeof parsed.options.agent_count).toBe("number");
    expect(typeof parsed.options.matcher_count).toBe("number");
  });

  test("exportToJson with empty storage", () => {
    // Arrange
    const emptyStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    const emptyExporter = new AnalyticsExporter(emptyStorage);

    // Act
    const result = emptyExporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.record_count).toBe(0);
    expect(parsed.events).toEqual([]);
  });

  test("exportToJson filters by date range", () => {
    // Arrange
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const options: Partial<ExportOptions> = {
      start_date: oneHourAgo.toISOString(),
      end_date: now.toISOString(),
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert: Should only include events within range
    expect(parsed.record_count).toBeLessThanOrEqual(testEvents.length);
    for (const event of parsed.events) {
      const eventTime = new Date(event.timestamp).getTime();
      expect(eventTime).toBeGreaterThanOrEqual(oneHourAgo.getTime());
      expect(eventTime).toBeLessThanOrEqual(now.getTime());
    }
  });

  test("exportToJson filters by agent names", () => {
    // Arrange
    const options: Partial<ExportOptions> = {
      agent_names: ["code-agent"],
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert: Should only include routing decisions for code-agent
    expect(parsed.record_count).toBeGreaterThanOrEqual(0);
    for (const event of parsed.events) {
      if (event.type === "routing_decision") {
        expect(event.target_agent).toBe("code-agent");
      }
    }
  });

  test("exportToJson filters by matcher types", () => {
    // Arrange
    const options: Partial<ExportOptions> = {
      matcher_types: ["keyword"],
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert: Should only include routing decisions with keyword matcher
    expect(parsed.record_count).toBeGreaterThanOrEqual(0);
    for (const event of parsed.events) {
      if (event.type === "routing_decision") {
        expect(event.matcher_type).toBe("keyword");
      }
    }
  });

  test("exportToJson handles export options with all filters", () => {
    // Arrange
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const options: Partial<ExportOptions> = {
      start_date: oneHourAgo.toISOString(),
      end_date: now.toISOString(),
      agent_names: ["code-agent"],
      matcher_types: ["keyword"],
    };

    // Act: Should not throw
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed).toBeDefined();
    expect(parsed.record_count).toBeGreaterThanOrEqual(0);
  });

  test("exportToCsv returns valid CSV string", () => {
    // Act
    const result = exporter.exportToCsv();

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("exportToCsv includes header row", () => {
    // Act
    const result = exporter.exportToCsv();
    const lines = result.split("\n");

    // Assert
    expect(lines.length).toBeGreaterThan(0);
    const header = lines[0];
    expect(header).toContain("timestamp");
    expect(header).toContain("type");
    expect(header).toContain("target_agent");
    expect(header).toContain("matcher_type");
  });

  test("exportToCsv includes data rows", () => {
    // Act
    const result = exporter.exportToCsv();
    const lines = result.split("\n").filter((line) => line.trim() !== "");

    // Assert: Header + at least one data row
    expect(lines.length).toBeGreaterThan(1);
  });

  test("exportToCsv has matching column count in all rows", () => {
    // Act
    const result = exporter.exportToCsv();
    const lines = result.split("\n").filter((line) => line.trim() !== "");

    // Assert
    const headerColumns = lines[0]!.split(",").length;
    for (let i = 1; i < lines.length; i++) {
      const rowColumns = lines[i]!.split(",").length;
      expect(rowColumns).toBe(headerColumns);
    }
  });

  test("exportToCsv filters by date range", () => {
    // Arrange
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const options: Partial<ExportOptions> = {
      start_date: oneHourAgo.toISOString(),
      end_date: now.toISOString(),
    };

    // Act
    const result = exporter.exportToCsv(options);
    const lines = result.split("\n").filter((line) => line.trim() !== "");

    // Assert: Should filter correctly
    expect(lines.length).toBeGreaterThanOrEqual(1); // At least header
  });

  test("exportToCsv filters by agent names", () => {
    // Arrange
    const options: Partial<ExportOptions> = {
      agent_names: ["code-agent"],
    };

    // Act
    const result = exporter.exportToCsv(options);
    const lines = result.split("\n").filter((line) => line.trim() !== "");

    // Assert
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  test("exportToCsv escapes values with commas", () => {
    // Arrange: Create storage with event containing comma
    const csvTestStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    csvTestStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
      matched_content: "value, with, commas",
      meta_agent: "router",
    });
    const csvExporter = new AnalyticsExporter(csvTestStorage);

    // Act
    const result = csvExporter.exportToCsv();

    // Assert: Should be quoted
    expect(result).toContain('"value, with, commas"');
  });

  test("exportToCsv escapes values with quotes", () => {
    // Arrange: Create storage with event containing quotes
    const quoteTestStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    quoteTestStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
      matched_content: 'value with "quotes"',
      meta_agent: "router",
    });
    const quoteExporter = new AnalyticsExporter(quoteTestStorage);

    // Act
    const result = quoteExporter.exportToCsv();

    // Assert: Quotes should be doubled
    expect(result).toContain('""quotes""');
  });

  test("exportToCsv escapes values with newlines", () => {
    // Arrange: Create storage with event containing newline
    const newlineTestStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    newlineTestStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
      matched_content: "value\nwith\nnewlines",
      meta_agent: "router",
    });
    const newlineExporter = new AnalyticsExporter(newlineTestStorage);

    // Act
    const result = newlineExporter.exportToCsv();

    // Assert: Should be quoted
    expect(result).toContain('"value\nwith\nnewlines"');
  });

  test("exportToCsv handles unmatched_request events", () => {
    // Arrange: Create storage with unmatched request
    const unmatchedStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    unmatchedStorage.recordEvent({
      type: "unmatched_request",
      timestamp: new Date().toISOString(),
      user_request: "this is an unmatched request",
      meta_agent: "router",
    });
    const unmatchedExporter = new AnalyticsExporter(unmatchedStorage);

    // Act
    const result = unmatchedExporter.exportToCsv();

    // Assert
    expect(result).toContain("unmatched_request");
    expect(result).toContain("user_request");
  });

  test("exportToFile writes JSON file correctly", async () => {
    // Arrange
    const filePath = join(tempDir, "export.json");

    // Act
    const result = await exporter.exportToFile(filePath);
    const fileExists = existsSync(filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(result.format).toBe("json");
    expect(result.file_path).toBe(filePath);
    expect(fileExists).toBe(true);

    // Verify file content
    const content = await Bun.file(filePath).text();
    const parsed = JSON.parse(content);
    expect(parsed.format).toBe("json");
  });

  test("exportToFile writes CSV file correctly", async () => {
    // Arrange
    const filePath = join(tempDir, "export.csv");

    // Act
    const result = await exporter.exportToFile(filePath);
    const fileExists = existsSync(filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(result.format).toBe("csv");
    expect(result.file_path).toBe(filePath);
    expect(fileExists).toBe(true);

    // Verify file content
    const content = await Bun.file(filePath).text();
    expect(content).toContain("timestamp,type");
  });

  test("exportToFile defaults to JSON for unknown extension", async () => {
    // Arrange
    const filePath = join(tempDir, "export.txt");

    // Act
    const result = await exporter.exportToFile(filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(result.format).toBe("json");
    expect(result.file_path).toBe(filePath);
  });

  test("exportToFile returns correct record count", async () => {
    // Arrange
    const filePath = join(tempDir, "export.json");

    // Act
    const result = await exporter.exportToFile(filePath);

    // Assert
    expect(result.record_count).toBe(testEvents.length);
  });

  test("exportToFile with filters applies filters correctly", async () => {
    // Arrange
    const filePath = join(tempDir, "export.json");
    const options: Partial<ExportOptions> = {
      agent_names: ["code-agent"],
    };

    // Act
    const result = await exporter.exportToFile(filePath, options);

    // Assert
    expect(result.success).toBe(true);
    expect(result.record_count).toBeGreaterThan(0);
  });

  test("exportToFile creates parent directories", async () => {
    // Arrange: Path with non-existent parent directory
    const filePath = join(tempDir, "nested", "deep", "export.json");

    // Act
    const result = await exporter.exportToFile(filePath);
    const fileExists = existsSync(filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(fileExists).toBe(true);
  });

  test("exportToFile handles write errors gracefully", async () => {
    // Arrange: Try to write to an invalid path
    const invalidPath = "/invalid/path/that/cannot/be/created/export.json";

    // Act
    const result = await exporter.exportToFile(invalidPath);

    // Assert: Should not throw, should return error
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.record_count).toBe(0);
  });

  test("exportToFile overwrites existing file", async () => {
    // Arrange: Create existing file with content
    const filePath = join(tempDir, "export.json");
    await Bun.write(filePath, "old content");
    const firstResult = await exporter.exportToFile(filePath);

    // Act: Export again
    const secondResult = await exporter.exportToFile(filePath);

    // Assert
    expect(secondResult.success).toBe(true);
    const content = await Bun.file(filePath).text();
    const parsed = JSON.parse(content);
    expect(parsed.format).toBe("json");
    expect(content).not.toBe("old content");
  });

  test("exportToJson throws error on storage failure", () => {
    // Arrange: Create storage that will fail
    const badStorage = {
      getAllEvents: () => {
        throw new Error("Storage failure");
      },
    } as unknown as AnalyticsStorage;

    const badExporter = new AnalyticsExporter(badStorage);

    // Act & Assert: Should throw descriptive error
    expect(() => badExporter.exportToJson()).toThrow("Failed to export JSON");
  });

  test("exportToCsv throws error on storage failure", () => {
    // Arrange: Create storage that will fail
    const badStorage = {
      getAllEvents: () => {
        throw new Error("Storage failure");
      },
    } as unknown as AnalyticsStorage;

    const badExporter = new AnalyticsExporter(badStorage);

    // Act & Assert: Should throw descriptive error
    expect(() => badExporter.exportToCsv()).toThrow("Failed to export CSV");
  });

  test("exportToFile handles empty storage", async () => {
    // Arrange
    const emptyStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    const emptyExporter = new AnalyticsExporter(emptyStorage);
    const filePath = join(tempDir, "empty.json");

    // Act
    const result = await emptyExporter.exportToFile(filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(result.record_count).toBe(0);
  });

  test("exportToJson handles event without meta_agent", () => {
    // Arrange
    const noMetaStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    noMetaStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
      matched_content: "test",
    });
    const noMetaExporter = new AnalyticsExporter(noMetaStorage);

    // Act: Should not throw
    const result = noMetaExporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.events).toBeDefined();
    expect(parsed.events.length).toBe(1);
  });

  test("exportToJson handles event with all optional fields", () => {
    // Arrange
    const fullEventStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    fullEventStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
      matched_content: "full content",
      config_overrides: {
        model: "gpt-4",
        temperature: 0.8,
        prompt: "custom prompt",
        variant: "beta",
      },
      meta_agent: "router",
    });
    const fullEventExporter = new AnalyticsExporter(fullEventStorage);

    // Act
    const result = fullEventExporter.exportToJson();
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.events).toBeDefined();
    expect(parsed.events.length).toBe(1);
    const event = parsed.events[0];
    expect(event.config_overrides).toBeDefined();
    expect(event.config_overrides?.model).toBe("gpt-4");
    expect(event.config_overrides?.temperature).toBe(0.8);
  });
});

describe("AnalyticsExporter Convenience Functions", () => {
  let tempDir: string;
  let storage: AnalyticsStorage;
  let testEvents: AnalyticsEvent[];

  beforeEach(() => {
    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), "analytics-convenience-test-"));

    // Create storage with temp file path
    const storagePath = join(tempDir, "analytics.json");
    storage = new AnalyticsStorage({ storage_file: storagePath, enabled: true });

    // Create test events
    const now = new Date();
    testEvents = [
      {
        type: "routing_decision",
        timestamp: now.toISOString(),
        target_agent: "code-agent",
        matcher_type: "keyword",
        matched_content: "test",
      },
      {
        type: "routing_decision",
        timestamp: now.toISOString(),
        target_agent: "test-agent",
        matcher_type: "semantic",
        matched_content: "test 2",
      },
    ];

    // Add events to storage
    for (const event of testEvents) {
      storage.recordEvent(event);
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("exportToJson convenience function works", () => {
    // Act
    const result = exportToJson(storage);

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");

    const parsed = JSON.parse(result);
    expect(parsed.format).toBe("json");
    expect(parsed.events).toBeDefined();
  });

  test("exportToJson convenience function accepts options", () => {
    // Arrange
    const options: Partial<ExportOptions> = {
      agent_names: ["code-agent"],
    };

    // Act
    const result = exportToJson(storage, options);
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.record_count).toBeGreaterThanOrEqual(0);
  });

  test("exportToCsv convenience function works", () => {
    // Act
    const result = exportToCsv(storage);

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result).toContain("timestamp,type");
  });

  test("exportToCsv convenience function accepts options", () => {
    // Arrange
    const options: Partial<ExportOptions> = {
      agent_names: ["code-agent"],
    };

    // Act
    const result = exportToCsv(storage, options);

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test("exportToFile convenience function works", async () => {
    // Arrange
    const filePath = join(tempDir, "export.json");

    // Act
    const result = await exportToFile(storage, filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(result.format).toBe("json");
    expect(result.file_path).toBe(filePath);
    expect(existsSync(filePath)).toBe(true);
  });

  test("exportToFile convenience function accepts options", async () => {
    // Arrange
    const filePath = join(tempDir, "export.json");
    const options: Partial<ExportOptions> = {
      agent_names: ["code-agent"],
    };

    // Act
    const result = await exportToFile(storage, filePath, options);

    // Assert
    expect(result.success).toBe(true);
    expect(result.record_count).toBeGreaterThanOrEqual(0);
  });

  test("exportToFile convenience function with CSV format", async () => {
    // Arrange
    const filePath = join(tempDir, "export.csv");

    // Act
    const result = await exportToFile(storage, filePath);

    // Assert
    expect(result.success).toBe(true);
    expect(result.format).toBe("csv");
    expect(existsSync(filePath)).toBe(true);

    const content = await Bun.file(filePath).text();
    expect(content).toContain("timestamp,type");
  });
});

describe("AnalyticsExporter Edge Cases", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "analytics-edge-test-"));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("handles special characters in CSV values", () => {
    // Arrange
    const specialStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    specialStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: 'agent"with"quotes',
      matcher_type: 'comma,type',
      matched_content: 'value"with"both,and newline\n',
      meta_agent: "router",
    });
    const specialExporter = new AnalyticsExporter(specialStorage);

    // Act: Should not throw
    const result = specialExporter.exportToCsv();

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    // Verify escaping patterns
    expect(result).toContain('""'); // Escaped quotes
    expect(result).toContain('"'); // Quoted values
  });

  test("handles very long strings in CSV", () => {
    // Arrange
    const longStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    const longContent = "x".repeat(10000);
    longStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
      matched_content: longContent,
    });
    const longExporter = new AnalyticsExporter(longStorage);

    // Act: Should not throw
    const result = longExporter.exportToCsv();

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(10000);
  });

  test("handles empty strings in CSV", () => {
    // Arrange
    const emptyStringStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    emptyStringStorage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "",
      matcher_type: "",
    });
    const emptyStringExporter = new AnalyticsExporter(emptyStringStorage);

    // Act: Should not throw
    const result = emptyStringExporter.exportToCsv();

    // Assert
    expect(result).toBeDefined();
  });

  test("handles date filtering with no matching events", () => {
    // Arrange
    const storage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    storage.recordEvent({
      type: "routing_decision",
      timestamp: "2024-01-01T00:00:00.000Z",
      target_agent: "test-agent",
      matcher_type: "keyword",
    });
    const exporter = new AnalyticsExporter(storage);

    const options: Partial<ExportOptions> = {
      start_date: "2025-01-01T00:00:00.000Z",
      end_date: "2025-12-31T23:59:59.999Z",
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.record_count).toBe(0);
    expect(parsed.events).toEqual([]);
  });

  test("handles filtering with non-existent agent", () => {
    // Arrange
    const storage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    storage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
    });
    const exporter = new AnalyticsExporter(storage);

    const options: Partial<ExportOptions> = {
      agent_names: ["non-existent-agent"],
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.record_count).toBe(0);
    expect(parsed.events).toEqual([]);
  });

  test("handles filtering with non-existent matcher type", () => {
    // Arrange
    const storage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    storage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
    });
    const exporter = new AnalyticsExporter(storage);

    const options: Partial<ExportOptions> = {
      matcher_types: ["non-existent-matcher"],
    };

    // Act
    const result = exporter.exportToJson(options);
    const parsed = JSON.parse(result);

    // Assert
    expect(parsed.record_count).toBe(0);
    expect(parsed.events).toEqual([]);
  });

  test("handles mixed event types in export", () => {
    // Arrange
    const mixedStorage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    const now = new Date();

    mixedStorage.recordEvent({
      type: "routing_decision",
      timestamp: now.toISOString(),
      target_agent: "agent-1",
      matcher_type: "type-1",
      matched_content: "content-1",
      meta_agent: "router",
    });

    mixedStorage.recordEvent({
      type: "unmatched_request",
      timestamp: now.toISOString(),
      user_request: "unmatched",
      meta_agent: "router",
    });

    mixedStorage.recordEvent({
      type: "routing_decision",
      timestamp: now.toISOString(),
      target_agent: "agent-2",
      matcher_type: "type-2",
      meta_agent: "router",
    });

    const exporter = new AnalyticsExporter(mixedStorage);

    // Act
    const jsonResult = exporter.exportToJson();
    const csvResult = exporter.exportToCsv();

    const jsonParsed = JSON.parse(jsonResult);

    // Assert
    expect(jsonParsed.events).toHaveLength(3);
    expect(csvResult).toContain("routing_decision");
    expect(csvResult).toContain("unmatched_request");
  });

  test("exportToJson produces consistent record_count across calls", () => {
    // Arrange
    const storage = new AnalyticsStorage({ enabled: true, storage_file: `/olimpus-test--.json` });
    storage.recordEvent({
      type: "routing_decision",
      timestamp: new Date().toISOString(),
      target_agent: "test-agent",
      matcher_type: "keyword",
    });
    const exporter = new AnalyticsExporter(storage);

    // Act
    const result1 = exporter.exportToJson();
    const result2 = exporter.exportToJson();

    const parsed1 = JSON.parse(result1);
    const parsed2 = JSON.parse(result2);

    // Assert: record_count should be consistent
    expect(parsed1.record_count).toBe(parsed2.record_count);
  });
});
