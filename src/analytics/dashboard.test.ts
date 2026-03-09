import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	AnalyticsDashboard,
	DashboardOutputSchema,
	FormattedMetricsSchema,
	displayAnalytics,
	getFormattedAnalytics,
} from "./dashboard.js";
import type {
	AnalyticsEvent,
	DisplayOptions,
	RoutingDecisionEvent,
	UnmatchedRequestEvent,
} from "./types.js";

describe("AnalyticsDashboard", () => {
	let originalConsoleLog: typeof console.log;
	let logOutput: string[];
	let sampleEvents: AnalyticsEvent[];

	beforeEach(() => {
		// Save original console.log
		originalConsoleLog = console.log;

		// Capture console.log output
		logOutput = [];
		console.log = (...args: unknown[]) => {
			logOutput.push(args.map((arg) => String(arg)).join(" "));
		};

		// Create sample events
		sampleEvents = [
			{
				type: "routing_decision",
				timestamp: "2024-01-01T10:00:00.000Z",
				target_agent: "code-writer",
				matcher_type: "semantic",
				meta_agent: "router-main",
			},
			{
				type: "routing_decision",
				timestamp: "2024-01-01T11:00:00.000Z",
				target_agent: "code-writer",
				matcher_type: "semantic",
				meta_agent: "router-main",
			},
			{
				type: "routing_decision",
				timestamp: "2024-01-01T12:00:00.000Z",
				target_agent: "code-reviewer",
				matcher_type: "keyword",
				meta_agent: "router-main",
			},
			{
				type: "unmatched_request",
				timestamp: "2024-01-01T13:00:00.000Z",
				user_request: "Make me a sandwich",
				meta_agent: "router-main",
			},
		];
	});

	afterEach(() => {
		// Restore original console.log
		console.log = originalConsoleLog;

		// Clear log output
		logOutput = [];
	});

	describe("constructor", () => {
		test("creates dashboard with empty events by default", () => {
			// Arrange & Act
			const dashboard = new AnalyticsDashboard();

			// Assert
			expect(dashboard).toBeDefined();
			const metrics = dashboard.getFormattedMetrics();
			expect(metrics.summary.total_events).toBe(0);
		});

		test("creates dashboard with provided events", () => {
			// Arrange & Act
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Assert
			expect(dashboard).toBeDefined();
			const metrics = dashboard.getFormattedMetrics();
			expect(metrics.summary.total_events).toBe(4);
		});

		test("merges provided options with defaults", () => {
			// Arrange
			const customOptions: Partial<DisplayOptions> = {
				show_unmatched_requests: false,
				limit: 5,
			};

			// Act
			const dashboard = new AnalyticsDashboard([], customOptions);

			// Assert - getFormattedMetrics should use merged options
			const metrics = dashboard.getFormattedMetrics();
			expect(metrics).toBeDefined();
		});

		test("default options are set correctly", () => {
			// Arrange & Act
			const dashboard = new AnalyticsDashboard([]);

			// Assert
			const metrics = dashboard.getFormattedMetrics();
			expect(metrics).toBeDefined();
			// Default options should work without throwing
		});
	});

	describe("updateEvents", () => {
		test("updates events in the dashboard", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const newEvents: AnalyticsEvent[] = [
				{
					type: "routing_decision",
					timestamp: "2024-01-02T10:00:00.000Z",
					target_agent: "new-agent",
					matcher_type: "test",
				},
			];
			dashboard.updateEvents(newEvents);

			// Assert
			const metrics = dashboard.getFormattedMetrics();
			expect(metrics.summary.total_events).toBe(1);
			expect(metrics.summary.unique_agents).toBe(1);
		});

		test("handles empty events array", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			dashboard.updateEvents([]);

			// Assert
			const metrics = dashboard.getFormattedMetrics();
			expect(metrics.summary.total_events).toBe(0);
		});
	});

	describe("getFormattedMetrics", () => {
		test("returns metrics that pass Zod validation", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			const validation = FormattedMetricsSchema.safeParse(metrics);
			expect(validation.success).toBe(true);
		});

		test("calculates summary statistics correctly", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.total_events).toBe(4);
			expect(metrics.summary.routing_decisions).toBe(3);
			expect(metrics.summary.unmatched_requests).toBe(1);
			expect(metrics.summary.unique_agents).toBe(2);
			expect(metrics.summary.unique_matchers).toBe(2);
			expect(metrics.summary.unique_meta_agents).toBe(1);
		});

		test("includes date range when events exist", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.date_range).toBeDefined();
			expect(metrics.summary.date_range?.start).toBe(
				"2024-01-01T10:00:00.000Z",
			);
			expect(metrics.summary.date_range?.end).toBe("2024-01-01T13:00:00.000Z");
		});

		test("returns undefined date range for empty events", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard([]);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.date_range).toBeUndefined();
		});

		test("calculates top agents sorted by request count", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.top_agents.length).toBe(2);
			expect(metrics.top_agents[0]!.name).toBe("code-writer");
			expect(metrics.top_agents[0]!.requests).toBe(2);
			expect(metrics.top_agents[0]!.success_rate).toBe(1);
			expect(metrics.top_agents[1]!.name).toBe("code-reviewer");
			expect(metrics.top_agents[1]!.requests).toBe(1);
		});

		test("calculates top matchers sorted by evaluation count", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.top_matchers.length).toBe(2);
			expect(metrics.top_matchers[0]!.type).toBe("semantic");
			expect(metrics.top_matchers[0]!.evaluations).toBe(2);
			expect(metrics.top_matchers[0]!.match_rate).toBe(1);
			expect(metrics.top_matchers[1]!.type).toBe("keyword");
			expect(metrics.top_matchers[1]!.evaluations).toBe(1);
		});

		test("includes detailed agent information", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.agent_details["code-writer"]).toBeDefined();
			expect(metrics.agent_details["code-writer"]!.total_requests).toBe(2);
			expect(metrics.agent_details["code-writer"]!.successful_requests).toBe(2);
			expect(metrics.agent_details["code-writer"]!.failed_requests).toBe(0);
			expect(metrics.agent_details["code-writer"]!.success_rate).toBe(1);
			expect(metrics.agent_details["code-writer"]!.last_used).toBe(
				"2024-01-01T11:00:00.000Z",
			);
			expect(
				metrics.agent_details["code-writer"]!.meta_agents["router-main"],
			).toBe(2);
		});

		test("includes detailed matcher information", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.matcher_details["semantic"]).toBeDefined();
			expect(metrics.matcher_details["semantic"]!.total_evaluations).toBe(2);
			expect(metrics.matcher_details["semantic"]!.matched_count).toBe(2);
			expect(metrics.matcher_details["semantic"]!.not_matched_count).toBe(0);
			expect(metrics.matcher_details["semantic"]!.match_rate).toBe(1);
			expect(
				metrics.matcher_details["semantic"]!.target_agents["code-writer"],
			).toBe(2);
		});

		test("includes unmatched requests", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.unmatched_requests.length).toBe(1);
			expect(metrics.unmatched_requests[0]!.timestamp).toBe(
				"2024-01-01T13:00:00.000Z",
			);
			expect(metrics.unmatched_requests[0]!.user_request).toBe(
				"Make me a sandwich",
			);
			expect(metrics.unmatched_requests[0]!.meta_agent).toBe("router-main");
		});

		test("handles empty events gracefully", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard([]);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.total_events).toBe(0);
			expect(metrics.top_agents).toEqual([]);
			expect(metrics.top_matchers).toEqual([]);
			expect(metrics.agent_details).toEqual({});
			expect(metrics.matcher_details).toEqual({});
			expect(metrics.unmatched_requests).toEqual([]);
		});

		test("merges display options with defaults", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents, {
				show_unmatched_requests: false,
			});

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert - metrics should still include unmatched_requests array
			// (the option affects display(), not getFormattedMetrics())
			expect(metrics.unmatched_requests.length).toBe(1);
		});
	});

	describe("display", () => {
		test("returns DashboardOutput that passes Zod validation", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const output = dashboard.display();

			// Assert
			const validation = DashboardOutputSchema.safeParse(output);
			expect(validation.success).toBe(true);
		});

		test("returns success and correct counts", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const output = dashboard.display();

			// Assert
			expect(output.success).toBe(true);
			expect(output.message).toBe("Dashboard displayed successfully");
			expect(output.total_events).toBe(4);
			expect(output.agent_count).toBe(2);
			expect(output.matcher_count).toBe(2);
			expect(output.unmatched_count).toBe(1);
		});

		test("logs summary to console", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert
			expect(logOutput.length).toBeGreaterThan(0);
			expect(
				logOutput.some((line) => line.includes("📊 Analytics Summary")),
			).toBe(true);
			expect(
				logOutput.some((line) => line.includes("Total Events:          4")),
			).toBe(true);
			expect(
				logOutput.some((line) => line.includes("Routing Decisions:     3")),
			).toBe(true);
			expect(
				logOutput.some((line) => line.includes("Unmatched Requests:    1")),
			).toBe(true);
		});

		test("logs top agents to console", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert
			expect(logOutput.some((line) => line.includes("🎯 Top Agents"))).toBe(
				true,
			);
			expect(logOutput.some((line) => line.includes("code-writer"))).toBe(true);
		});

		test("logs top matchers to console", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert
			expect(logOutput.some((line) => line.includes("🔍 Top Matchers"))).toBe(
				true,
			);
			expect(logOutput.some((line) => line.includes("semantic"))).toBe(true);
		});

		test("logs unmatched requests when enabled", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display({ show_unmatched_requests: true });

			// Assert
			expect(
				logOutput.some((line) => line.includes("⚠️ Unmatched Requests")),
			).toBe(true);
			expect(
				logOutput.some((line) => line.includes("Make me a sandwich")),
			).toBe(true);
		});

		test("does not log unmatched requests when disabled", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display({ show_unmatched_requests: false });

			// Assert
			expect(
				logOutput.some((line) => line.includes("⚠️ Unmatched Requests")),
			).toBe(false);
			expect(
				logOutput.some((line) => line.includes("Make me a sandwich")),
			).toBe(false);
		});

		test("handles empty events without error", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard([]);

			// Act & Assert - should not throw
			const output = dashboard.display();
			expect(output.success).toBe(true);
			expect(output.total_events).toBe(0);
		});

		test("respects display options passed to display", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents, {
				show_unmatched_requests: true, // default in constructor
			});
			logOutput = [];

			// Act - override at display time
			dashboard.display({ show_unmatched_requests: false });

			// Assert
			expect(
				logOutput.some((line) => line.includes("⚠️ Unmatched Requests")),
			).toBe(false);
		});
	});

	describe("date range calculation", () => {
		test("calculates correct date range for events with different times", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					type: "routing_decision",
					timestamp: "2024-01-01T00:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
				},
				{
					type: "routing_decision",
					timestamp: "2024-01-31T23:59:59.000Z",
					target_agent: "agent2",
					matcher_type: "test",
				},
			];
			const dashboard = new AnalyticsDashboard(events);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.date_range?.start).toBe(
				"2024-01-01T00:00:00.000Z",
			);
			expect(metrics.summary.date_range?.end).toBe("2024-01-31T23:59:59.000Z");
		});

		test("displays date range in summary", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert
			expect(logOutput.some((line) => line.includes("Date Range"))).toBe(true);
		});
	});

	describe("meta-agent tracking", () => {
		test("tracks meta-agents for each agent", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					type: "routing_decision",
					timestamp: "2024-01-01T10:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
					meta_agent: "meta1",
				},
				{
					type: "routing_decision",
					timestamp: "2024-01-01T11:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
					meta_agent: "meta2",
				},
				{
					type: "routing_decision",
					timestamp: "2024-01-01T12:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
					meta_agent: "meta1",
				},
			];
			const dashboard = new AnalyticsDashboard(events);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.unique_meta_agents).toBe(2);
			expect(metrics.agent_details["agent1"]!.meta_agents["meta1"]).toBe(2);
			expect(metrics.agent_details["agent1"]!.meta_agents["meta2"]).toBe(1);
		});

		test("handles events without meta-agent", () => {
			// Arrange
			const events: AnalyticsEvent[] = [
				{
					type: "routing_decision",
					timestamp: "2024-01-01T10:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
					meta_agent: "meta1",
				},
				{
					type: "routing_decision",
					timestamp: "2024-01-01T11:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
				},
			];
			const dashboard = new AnalyticsDashboard(events);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.unique_meta_agents).toBe(1);
			expect(metrics.agent_details["agent1"]!.meta_agents["meta1"]).toBe(1);
		});
	});

	describe("convenience functions", () => {
		test("displayAnalytics creates dashboard and displays", () => {
			// Act
			const output = displayAnalytics(sampleEvents);

			// Assert
			expect(output.success).toBe(true);
			expect(output.total_events).toBe(4);
			const validation = DashboardOutputSchema.safeParse(output);
			expect(validation.success).toBe(true);
		});

		test("getFormattedAnalytics creates dashboard and returns metrics", () => {
			// Act
			const metrics = getFormattedAnalytics(sampleEvents);

			// Assert
			expect(metrics.summary.total_events).toBe(4);
			const validation = FormattedMetricsSchema.safeParse(metrics);
			expect(validation.success).toBe(true);
		});

		test("displayAnalytics accepts options", () => {
			// Arrange
			logOutput = [];

			// Act
			const output = displayAnalytics(sampleEvents, {
				show_unmatched_requests: false,
			});

			// Assert
			expect(output.success).toBe(true);
			expect(
				logOutput.some((line) => line.includes("⚠️ Unmatched Requests")),
			).toBe(false);
		});

		test("getFormattedAnalytics accepts options", () => {
			// Act
			const metrics = getFormattedAnalytics(sampleEvents, {
				limit: 5,
			});

			// Assert
			expect(metrics).toBeDefined();
			expect(metrics.summary.total_events).toBe(4);
		});
	});

	describe("edge cases and error handling", () => {
		test("handles events with same timestamp", () => {
			// Arrange
			const timestamp = "2024-01-01T10:00:00.000Z";
			const events: AnalyticsEvent[] = [
				{
					type: "routing_decision",
					timestamp,
					target_agent: "agent1",
					matcher_type: "test",
				},
				{
					type: "routing_decision",
					timestamp,
					target_agent: "agent2",
					matcher_type: "test",
				},
			];
			const dashboard = new AnalyticsDashboard(events);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.summary.total_events).toBe(2);
			expect(metrics.summary.date_range?.start).toBe(timestamp);
			expect(metrics.summary.date_range?.end).toBe(timestamp);
		});

		test("handles events with matcher_type and target_agent", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);

			// Act
			const metrics = dashboard.getFormattedMetrics();

			// Assert
			expect(metrics.top_matchers.length).toBeGreaterThan(0);
			expect(metrics.top_agents.length).toBeGreaterThan(0);
		});

		test("handles single unmatched request", () => {
			// Arrange
			const events: UnmatchedRequestEvent[] = [
				{
					type: "unmatched_request",
					timestamp: "2024-01-01T10:00:00.000Z",
					user_request: "test request",
				},
			];
			const dashboard = new AnalyticsDashboard(events);

			// Act
			const output = dashboard.display();

			// Assert
			expect(output.success).toBe(true);
			expect(output.unmatched_count).toBe(1);
			expect(output.agent_count).toBe(0);
			expect(output.matcher_count).toBe(0);
		});

		test("handles single routing decision", () => {
			// Arrange
			const events: RoutingDecisionEvent[] = [
				{
					type: "routing_decision",
					timestamp: "2024-01-01T10:00:00.000Z",
					target_agent: "agent1",
					matcher_type: "test",
				},
			];
			const dashboard = new AnalyticsDashboard(events);

			// Act
			const output = dashboard.display();

			// Assert
			expect(output.success).toBe(true);
			expect(output.total_events).toBe(1);
			expect(output.agent_count).toBe(1);
			expect(output.matcher_count).toBe(1);
			expect(output.unmatched_count).toBe(0);
		});
	});

	describe("display output formatting", () => {
		test("formats success rate as percentage with one decimal", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert
			expect(logOutput.some((line) => line.includes("100.0%"))).toBe(true);
		});

		test("formats agent table with proper columns", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert - look for table headers
			expect(logOutput.some((line) => line.includes("Agent"))).toBe(true);
			expect(logOutput.some((line) => line.includes("Requests"))).toBe(true);
			expect(logOutput.some((line) => line.includes("Success Rate"))).toBe(
				true,
			);
		});

		test("formats matcher table with proper columns", () => {
			// Arrange
			const dashboard = new AnalyticsDashboard(sampleEvents);
			logOutput = [];

			// Act
			dashboard.display();

			// Assert - look for table headers
			expect(logOutput.some((line) => line.includes("Matcher"))).toBe(true);
			expect(logOutput.some((line) => line.includes("Evaluations"))).toBe(true);
			expect(logOutput.some((line) => line.includes("Match Rate"))).toBe(true);
		});
	});
});
