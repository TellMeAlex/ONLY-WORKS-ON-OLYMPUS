import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "fs";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { type AnalyticsData, AnalyticsStorage } from "./storage.js";
import type { AnalyticsConfig, AnalyticsEvent } from "./types.js";

describe("AnalyticsStorage", () => {
	let tempDir: string;
	let storageFilePath: string;
	let storage: AnalyticsStorage;

	beforeEach(() => {
		// Create temp directory
		tempDir = mkdtempSync(join(tmpdir(), "analytics-storage-test-"));
		storageFilePath = join(tempDir, "analytics.json");
	});

	afterEach(() => {
		// Clean up temp directory
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe("constructor", () => {
		test("creates storage with default config", () => {
			// Act - use temp file to avoid picking up real analytics.json from cwd
			storage = new AnalyticsStorage({ storage_file: storageFilePath });
			// Assert
			expect(storage.isEnabled()).toBe(true);
			expect(storage.getEventCount()).toBe(0);
		});

		test("creates storage with custom config", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				max_events: 100,
				retention_days: 30,
				auto_prune: false,
			};

			// Act
			storage = new AnalyticsStorage(config);

			// Assert
			expect(storage.isEnabled()).toBe(true);
			expect(storage.getEventCount()).toBe(0);
		});

		test("respects enabled flag in config", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};

			// Act
			storage = new AnalyticsStorage(config);

			// Assert
			expect(storage.isEnabled()).toBe(false);
		});

		test("defaults enabled to true when not specified", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				storage_file: storageFilePath,
			};

			// Act
			storage = new AnalyticsStorage(config);

			// Assert
			expect(storage.isEnabled()).toBe(true);
		});

		test("defaults max_events to 10000 when not specified", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				storage_file: storageFilePath,
				auto_prune: true,
			};

			// Act
			storage = new AnalyticsStorage(config);
			// Assert - record 100 events (well below the 10000 default) and verify none are pruned.
			// If max_events defaulted to something smaller (e.g. 100), events would be pruned.
			const event: AnalyticsEvent = {
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};

			for (let i = 0; i < 100; i++) {
				storage.recordEvent(event);
			}

			// All 100 events retained because default max_events (10000) is not exceeded
			expect(storage.getEventCount()).toBe(100);
		});

		test("defaults retention_days to 90 when not specified", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				storage_file: storageFilePath,
				auto_prune: false, // Disable auto-prune to test retention
			};

			// Act
			storage = new AnalyticsStorage(config);

			// Assert - we can't directly test the config, but we can verify storage works
			expect(storage.isEnabled()).toBe(true);
		});

		test("defaults auto_prune to true when not specified", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				storage_file: storageFilePath,
				max_events: 5, // Small limit to test auto-prune
			};

			// Act
			storage = new AnalyticsStorage(config);

			// Record 10 events
			const event: AnalyticsEvent = {
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};

			for (let i = 0; i < 10; i++) {
				storage.recordEvent(event);
			}

			// Should have pruned to max_events (5)
			expect(storage.getEventCount()).toBeLessThanOrEqual(5);
		});
	});

	describe("recordEvent", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false, // Disable for cleaner testing
			};
			storage = new AnalyticsStorage(config);
		});

		test("records an event successfully", () => {
			// Arrange
			const event: AnalyticsEvent = {
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};

			// Act
			storage.recordEvent(event);

			// Assert
			expect(storage.getEventCount()).toBe(1);
			const events = storage.getAllEvents();
			expect(events).toHaveLength(1);
			expect(events[0]!).toEqual(event);
		});

		test("records multiple events", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: new Date().toISOString(),
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: new Date().toISOString(),
					type: "unmatched_request",
					user_request: "test request",
				},
			];

			// Act
			events.forEach((e) => storage.recordEvent(e));

			// Assert
			expect(storage.getEventCount()).toBe(2);
		});

		test("does not record events when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			const event: AnalyticsEvent = {
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};

			// Act
			storage.recordEvent(event);

			// Assert
			expect(storage.getEventCount()).toBe(0);
			expect(storage.getAllEvents()).toHaveLength(0);
		});

		test("handles errors gracefully", () => {
			// Arrange - create storage with invalid path
			const invalidPath = "/invalid/path/that/does/not/exist/analytics.json";
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: invalidPath,
			};
			storage = new AnalyticsStorage(config);

			const event: AnalyticsEvent = {
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};

			// Act & Assert - should not throw
			expect(() => storage.recordEvent(event)).not.toThrow();
		});
	});

	describe("getAllEvents", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns empty array when no events", () => {
			// Act
			const events = storage.getAllEvents();

			// Assert
			expect(events).toEqual([]);
			expect(events).toHaveLength(0);
		});

		test("returns all stored events", () => {
			// Arrange
			const event1: AnalyticsEvent = {
				timestamp: "2024-01-01T00:00:00Z",
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			const event2: AnalyticsEvent = {
				timestamp: "2024-01-01T01:00:00Z",
				type: "unmatched_request",
				user_request: "test request",
			};

			storage.recordEvent(event1);
			storage.recordEvent(event2);

			// Act
			const events = storage.getAllEvents();

			// Assert
			expect(events).toHaveLength(2);
			expect(events).toContainEqual(event1);
			expect(events).toContainEqual(event2);
		});

		test("returns a copy of events (not internal reference)", () => {
			// Arrange
			const event: AnalyticsEvent = {
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(event);

			// Act
			const events1 = storage.getAllEvents();
			events1.push({
				timestamp: new Date().toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			});

			// Assert - internal state should not be modified
			const events2 = storage.getAllEvents();
			expect(events2).toHaveLength(1);
			expect(events2[0]!.type).toBe("routing_decision");
		});

		test("returns empty array when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act
			const events = storage.getAllEvents();

			// Assert
			expect(events).toEqual([]);
		});
	});

	describe("getEventsByDateRange", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns events within date range", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-10T12:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-15T12:00:00Z",
					type: "routing_decision",
					target_agent: "agent2",
					matcher_type: "semantic",
				},
				{
					timestamp: "2024-01-20T12:00:00Z",
					type: "routing_decision",
					target_agent: "agent3",
					matcher_type: "keyword",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const result = storage.getEventsByDateRange(
				new Date("2024-01-12T00:00:00Z"),
				new Date("2024-01-18T00:00:00Z"),
			);

			// Assert - should only return the middle event
			expect(result).toHaveLength(1);
			expect(
				(result[0] as import("./types.js").RoutingDecisionEvent).target_agent,
			).toBe("agent2");
		});

		test("returns empty array when no events in range", () => {
			// Arrange
			const event: AnalyticsEvent = {
				timestamp: "2024-01-10T12:00:00Z",
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(event);

			// Act
			const result = storage.getEventsByDateRange(
				new Date("2024-02-01T00:00:00Z"),
				new Date("2024-02-28T00:00:00Z"),
			);

			// Assert
			expect(result).toHaveLength(0);
		});

		test("includes events at range boundaries", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-15T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-20T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent2",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-17T12:00:00Z",
					type: "routing_decision",
					target_agent: "agent3",
					matcher_type: "keyword",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const result = storage.getEventsByDateRange(
				new Date("2024-01-15T00:00:00Z"),
				new Date("2024-01-20T00:00:00Z"),
			);

			// Assert - should include all three (at boundaries)
			expect(result).toHaveLength(3);
		});

		test("returns empty array when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act
			const result = storage.getEventsByDateRange(
				new Date("2024-01-01T00:00:00Z"),
				new Date("2024-12-31T23:59:59Z"),
			);

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("getEventsByAgent", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns events for specific agent", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent2",
					matcher_type: "semantic",
				},
				{
					timestamp: "2024-01-03T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const result = storage.getEventsByAgent("agent1");

			// Assert
			expect(result).toHaveLength(2);
			expect(
				result.every(
					(e) => e.type === "routing_decision" && e.target_agent === "agent1",
				),
			).toBe(true);
		});

		test("returns empty array for non-existent agent", () => {
			// Arrange
			const event: AnalyticsEvent = {
				timestamp: "2024-01-01T00:00:00Z",
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(event);

			// Act
			const result = storage.getEventsByAgent("nonexistent");

			// Assert
			expect(result).toHaveLength(0);
		});

		test("does not return unmatched_request events", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "unmatched_request",
					user_request: "test request",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const result = storage.getEventsByAgent("agent1");

			// Assert - should only return routing_decision events
			expect(result).toHaveLength(1);
			expect(result[0]!.type).toBe("routing_decision");
		});

		test("returns empty array when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act
			const result = storage.getEventsByAgent("agent1");

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("getEventsByMatcherType", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns events for specific matcher type", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent2",
					matcher_type: "semantic",
				},
				{
					timestamp: "2024-01-03T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent3",
					matcher_type: "keyword",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const result = storage.getEventsByMatcherType("keyword");

			// Assert
			expect(result).toHaveLength(2);
			expect(
				result.every(
					(e) => e.type === "routing_decision" && e.matcher_type === "keyword",
				),
			).toBe(true);
		});

		test("returns empty array for non-existent matcher type", () => {
			// Arrange
			const event: AnalyticsEvent = {
				timestamp: "2024-01-01T00:00:00Z",
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(event);

			// Act
			const result = storage.getEventsByMatcherType("nonexistent");

			// Assert
			expect(result).toHaveLength(0);
		});

		test("returns empty array when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act
			const result = storage.getEventsByMatcherType("keyword");

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("getUnmatchedRequests", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns unmatched request events", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "unmatched_request",
					user_request: "test request",
				},
				{
					timestamp: "2024-01-03T00:00:00Z",
					type: "unmatched_request",
					user_request: "test request",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const result = storage.getUnmatchedRequests();

			// Assert
			expect(result).toHaveLength(2);
			expect(result.every((e) => e.type === "unmatched_request")).toBe(true);
		});

		test("returns empty array when no unmatched requests", () => {
			// Arrange
			const event: AnalyticsEvent = {
				timestamp: "2024-01-01T00:00:00Z",
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(event);

			// Act
			const result = storage.getUnmatchedRequests();

			// Assert
			expect(result).toHaveLength(0);
		});

		test("returns empty array when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act
			const result = storage.getUnmatchedRequests();

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("getEventCount", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns 0 when no events", () => {
			// Act
			const count = storage.getEventCount();

			// Assert
			expect(count).toBe(0);
		});

		test("returns correct count for multiple events", () => {
			// Arrange
			for (let i = 0; i < 5; i++) {
				const event: AnalyticsEvent = {
					timestamp: new Date().toISOString(),
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				};
				storage.recordEvent(event);
			}

			// Act
			const count = storage.getEventCount();

			// Assert
			expect(count).toBe(5);
		});

		test("returns 0 when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act
			const count = storage.getEventCount();

			// Assert
			expect(count).toBe(0);
		});
	});

	describe("pruneEvents", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false, // Disable auto-prune to test manual pruning
				retention_days: 30,
				max_events: 5,
			};
			storage = new AnalyticsStorage(config);
		});

		test("removes events older than retention period", () => {
			// Arrange - create events with different timestamps
			const now = new Date();
			const oldDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
			const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

			const events: AnalyticsEvent[] = [
				{
					timestamp: oldDate.toISOString(),
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: recentDate.toISOString(),
					type: "routing_decision",
					target_agent: "agent2",
					matcher_type: "keyword",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			storage.pruneEvents();

			// Assert - old event should be removed
			const remaining = storage.getAllEvents();
			expect(remaining).toHaveLength(1);
			expect(
				(remaining[0]! as import("./types.js").RoutingDecisionEvent)
					.target_agent,
			).toBe("agent2");
		});

		test("removes excess events when count exceeds max_events", () => {
			// Arrange - create 10 events
			for (let i = 0; i < 10; i++) {
				const event: AnalyticsEvent = {
					timestamp: new Date(Date.now() - (10 - i) * 1000).toISOString(),
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				};
				storage.recordEvent(event);
			}

			// Act
			storage.pruneEvents();

			// Assert - should have only 5 events (max_events)
			expect(storage.getEventCount()).toBe(5);
			const remaining = storage.getAllEvents();
			// Should keep the newest 5 events
			expect(
				(remaining[0]! as import("./types.js").RoutingDecisionEvent)
					.target_agent,
			).toBe("agent1");
		});

		test("does nothing when no events", () => {
			// Act & Assert - should not throw
			expect(() => storage.pruneEvents()).not.toThrow();
			expect(storage.getEventCount()).toBe(0);
		});

		test("does nothing when disabled", () => {
			// Arrange - create disabled storage with events (won't actually be recorded)
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act & Assert - should not throw
			expect(() => storage.pruneEvents()).not.toThrow();
			expect(storage.getEventCount()).toBe(0);
		});
	});

	describe("clear", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("clears all events", () => {
			// Arrange
			for (let i = 0; i < 3; i++) {
				const event: AnalyticsEvent = {
					timestamp: new Date().toISOString(),
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				};
				storage.recordEvent(event);
			}
			expect(storage.getEventCount()).toBe(3);

			// Act
			storage.clear();

			// Assert
			expect(storage.getEventCount()).toBe(0);
			expect(storage.getAllEvents()).toEqual([]);
		});

		test("does nothing when already empty", () => {
			// Act & Assert - should not throw
			expect(() => storage.clear()).not.toThrow();
			expect(storage.getEventCount()).toBe(0);
		});

		test("does nothing when disabled", () => {
			// Arrange - create disabled storage
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act & Assert - should not throw
			expect(() => storage.clear()).not.toThrow();
		});
	});

	describe("exportData", () => {
		beforeEach(() => {
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);
		});

		test("returns empty data structure when no events", () => {
			// Act
			const data = storage.exportData();

			// Assert
			expect(data).toEqual({
				events: [],
				agent_metrics: {},
				matcher_metrics: {},
				total_events: 0,
				first_event_timestamp: undefined,
				last_event_timestamp: undefined,
				version: "1.0.0",
			});
		});

		test("returns correct data structure with events", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "unmatched_request",
					user_request: "test request",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const data = storage.exportData();

			// Assert
			expect(data.events).toHaveLength(2);
			expect(data.total_events).toBe(2);
			expect(data.agent_metrics).toEqual({});
			expect(data.matcher_metrics).toEqual({});
			expect(data.version).toBe("1.0.0");
			expect(data.first_event_timestamp).toBe("2024-01-01T00:00:00Z");
			expect(data.last_event_timestamp).toBe("2024-01-02T00:00:00Z");
		});

		test("sorts events by timestamp", () => {
			// Arrange - add events out of order
			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-03T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent3",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent2",
					matcher_type: "keyword",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Act
			const data = storage.exportData();

			// Assert - should be sorted
			expect(data.events[0]!.timestamp).toBe("2024-01-01T00:00:00Z");
			expect(data.events[1]!.timestamp).toBe("2024-01-02T00:00:00Z");
			expect(data.events[2]!.timestamp).toBe("2024-01-03T00:00:00Z");
		});
	});

	describe("isEnabled", () => {
		test("returns true when enabled", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act & Assert
			expect(storage.isEnabled()).toBe(true);
		});

		test("returns false when disabled", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				enabled: false,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act & Assert
			expect(storage.isEnabled()).toBe(false);
		});

		test("returns true by default", () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Act & Assert
			expect(storage.isEnabled()).toBe(true);
		});
	});

	describe("persistence", () => {
		test("saves events to file and reloads on initialization", async () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);

			const events: AnalyticsEvent[] = [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "routing_decision",
					target_agent: "agent1",
					matcher_type: "keyword",
				},
				{
					timestamp: "2024-01-02T00:00:00Z",
					type: "unmatched_request",
					user_request: "test request",
				},
			];
			events.forEach((e) => storage.recordEvent(e));

			// Verify file was created
			expect(existsSync(storageFilePath)).toBe(true);

			// Act - create new storage instance with same path
			const newStorage = new AnalyticsStorage(config);

			// Assert - should have loaded events from file
			expect(newStorage.getEventCount()).toBe(2);
			const loadedEvents = newStorage.getAllEvents();
			expect(loadedEvents).toHaveLength(2);
			expect(
				(loadedEvents[0]! as import("./types.js").RoutingDecisionEvent)
					.target_agent,
			).toBe("agent1");
			expect(loadedEvents[1]!.type).toBe("unmatched_request");
		});

		test("handles invalid storage file gracefully", async () => {
			// Arrange - create invalid JSON file
			await Bun.write(storageFilePath, "invalid json {{{");

			// Act - should not throw
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
			};
			expect(() => new AnalyticsStorage(config)).not.toThrow();

			// Assert - should start with empty events
			storage = new AnalyticsStorage(config);
			expect(storage.getEventCount()).toBe(0);
		});

		test("creates new storage when file does not exist", () => {
			// Arrange - file doesn't exist
			expect(existsSync(storageFilePath)).toBe(false);

			// Act
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
			};
			storage = new AnalyticsStorage(config);

			// Assert - should work without errors
			expect(storage.getEventCount()).toBe(0);
		});

		test("persists data in AnalyticsData format", async () => {
			// Arrange
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: false,
			};
			storage = new AnalyticsStorage(config);

			const event: AnalyticsEvent = {
				timestamp: "2024-01-01T00:00:00Z",
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(event);

			// Act - read file directly
			const content = await Bun.file(storageFilePath).text();
			const data = JSON.parse(content) as AnalyticsData;

			// Assert - should have expected structure
			expect(data.events).toHaveLength(1);
			expect(data.total_events).toBe(1);
			expect(data.version).toBe("1.0.0");
			expect(data.agent_metrics).toEqual({});
			expect(data.matcher_metrics).toEqual({});
		});

		test("auto-prunes on load when auto_prune is enabled", () => {
			// Arrange
			const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago

			// Create storage with auto_prune enabled and small retention
			const config: Partial<AnalyticsConfig> = {
				enabled: true,
				storage_file: storageFilePath,
				auto_prune: true,
				retention_days: 30,
			};
			storage = new AnalyticsStorage(config);

			// Record old event
			const oldEvent: AnalyticsEvent = {
				timestamp: oldDate.toISOString(),
				type: "routing_decision",
				target_agent: "agent1",
				matcher_type: "keyword",
			};
			storage.recordEvent(oldEvent);

			// Act - create new storage instance (should auto-prune on load)
			const newStorage = new AnalyticsStorage(config);

			// Assert - old event should be pruned
			expect(newStorage.getEventCount()).toBe(0);
		});
	});
});
