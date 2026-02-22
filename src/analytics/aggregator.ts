import { z } from "zod";
import type {
	AgentUsageMetrics,
	AggregationOptions,
	AnalyticsEvent,
	MatcherEffectivenessMetrics,
	RoutingDecisionEvent,
	TimeSeriesDataPoint,
	UnmatchedRequestEvent,
} from "./types.js";

/**
 * Re-export schemas from types for convenience
 * Defined first to avoid temporal dead zone issues
 */

export const AgentUsageMetricsSchema = z.object({
	agent_name: z.string(),
	total_requests: z.number().int().nonnegative(),
	successful_requests: z.number().int().nonnegative(),
	failed_requests: z.number().int().nonnegative(),
	last_used: z.string().datetime().optional(),
	average_request_duration_ms: z.number().nonnegative().optional(),
});

export const MatcherEffectivenessMetricsSchema = z.object({
	matcher_type: z.string(),
	total_evaluations: z.number().int().nonnegative(),
	matched_count: z.number().int().nonnegative(),
	not_matched_count: z.number().int().nonnegative(),
	match_rate: z.number().min(0).max(1),
	target_agents: z
		.record(z.string(), z.number().int().nonnegative())
		.optional(),
});

export const TimeSeriesDataPointSchema = z.object({
	timestamp: z.string().datetime(),
	value: z.number(),
});

/**
 * Aggregation Result Schema - Result of an aggregation operation
 */

export const AggregationResultSchema = z.object({
	total_events: z.number().int().nonnegative(),
	routing_decisions: z.number().int().nonnegative(),
	unmatched_requests: z.number().int().nonnegative(),
	agent_metrics: z.record(z.string(), AgentUsageMetricsSchema),
	matcher_metrics: z.record(z.string(), MatcherEffectivenessMetricsSchema),
	top_agents: z.array(z.string()),
	top_matchers: z.array(z.string()),
});

/**
 * Time Series Aggregation Schema - Result of time-based aggregation
 */

export const TimeSeriesAggregationSchema = z.object({
	series: z.record(z.string(), z.array(TimeSeriesDataPointSchema)),
	start_date: z.string().datetime(),
	end_date: z.string().datetime(),
	interval: z.enum(["hour", "day", "week", "month"]),
});

/**
 * Agent Statistics Schema - Statistics for a single agent
 */

export const AgentStatisticsSchema = z.object({
	agent_name: z.string(),
	total_requests: z.number().int().nonnegative(),
	successful_requests: z.number().int().nonnegative(),
	failed_requests: z.number().int().nonnegative(),
	success_rate: z.number().min(0).max(1),
	last_used: z.string().datetime().optional(),
	meta_agents: z.record(z.string(), z.number().int().nonnegative()),
});

/**
 * Matcher Statistics Schema - Statistics for a single matcher type
 */

export const MatcherStatisticsSchema = z.object({
	matcher_type: z.string(),
	total_evaluations: z.number().int().nonnegative(),
	matched_count: z.number().int().nonnegative(),
	not_matched_count: z.number().int().nonnegative(),
	match_rate: z.number().min(0).max(1),
	target_agents: z.record(z.string(), z.number().int().nonnegative()),
});

/**
 * Inferred TypeScript types from schemas
 */

export type AggregationResult = z.infer<typeof AggregationResultSchema>;
export type TimeSeriesAggregation = z.infer<typeof TimeSeriesAggregationSchema>;
export type AgentStatistics = z.infer<typeof AgentStatisticsSchema>;
export type MatcherStatistics = z.infer<typeof MatcherStatisticsSchema>;

/**
 * Create an aggregation result with default empty values
 */

export function createAggregationResult(): AggregationResult {
	return {
		total_events: 0,
		routing_decisions: 0,
		unmatched_requests: 0,
		agent_metrics: {},
		matcher_metrics: {},
		top_agents: [],
		top_matchers: [],
	};
}

/**
 * Create agent usage metrics for an agent
 */

export function createAgentUsageMetrics(agentName: string): AgentUsageMetrics {
	return {
		agent_name: agentName,
		total_requests: 0,
		successful_requests: 0,
		failed_requests: 0,
		last_used: undefined,
		average_request_duration_ms: undefined,
	};
}

/**
 * Create matcher effectiveness metrics for a matcher type
 */

export function createMatcherEffectivenessMetrics(
	matcherType: string,
): MatcherEffectivenessMetrics {
	return {
		matcher_type: matcherType,
		total_evaluations: 0,
		matched_count: 0,
		not_matched_count: 0,
		match_rate: 0,
		target_agents: {},
	};
}

/**
 * Create a time series aggregation result
 */

export function createTimeSeriesAggregation(
	startDate: string,
	endDate: string,
	interval: "hour" | "day" | "week" | "month",
): TimeSeriesAggregation {
	return {
		series: {},
		start_date: startDate,
		end_date: endDate,
		interval,
	};
}

/**
 * Check if an event is a routing decision event
 */

export function isRoutingDecisionEvent(
	event: AnalyticsEvent,
): event is RoutingDecisionEvent {
	return event.type === "routing_decision";
}

/**
 * Check if an event is an unmatched request event
 */

export function isUnmatchedRequestEvent(
	event: AnalyticsEvent,
): event is UnmatchedRequestEvent {
	return event.type === "unmatched_request";
}

/**
 * Main AnalyticsAggregator class for computing analytics metrics
 * Provides methods to aggregate and analyze routing analytics data
 *
 * Capabilities:
 * - Compute agent usage statistics (total requests, success rates, last used)
 * - Compute matcher effectiveness metrics (match rates, target agents)
 * - Generate time series data for trends over time
 * - Filter and aggregate events by date range and criteria
 */
export class AnalyticsAggregator {
	private events: AnalyticsEvent[];

	/**
	 * Creates a new AnalyticsAggregator instance
	 * @param events - Array of analytics events to aggregate
	 */
	constructor(events: AnalyticsEvent[] = []) {
		this.events = [...events];
	}

	/**
	 * Update the events to aggregate
	 * @param events - New array of analytics events
	 */
	updateEvents(events: AnalyticsEvent[]): void {
		this.events = [...events];
	}

	/**
	 * Get all routing decision events
	 */
	getRoutingDecisionEvents(): RoutingDecisionEvent[] {
		return this.events.filter(isRoutingDecisionEvent);
	}

	/**
	 * Get all unmatched request events
	 */
	getUnmatchedRequestEvents(): UnmatchedRequestEvent[] {
		return this.events.filter(isUnmatchedRequestEvent);
	}

	/**
	 * Filter events by date range
	 * @param startDate - Start date for filtering
	 * @param endDate - End date for filtering
	 */
	filterByDateRange(startDate: Date, endDate: Date): AnalyticsEvent[] {
		const start = startDate.getTime();
		const end = endDate.getTime();

		return this.events.filter((event) => {
			const eventTime = new Date(event.timestamp).getTime();
			return eventTime >= start && eventTime <= end;
		});
	}

	/**
	 * Filter events by agent names
	 * @param agentNames - Array of agent names to include
	 */
	filterByAgents(agentNames: string[]): AnalyticsEvent[] {
		const agentSet = new Set(agentNames);
		return this.events.filter((event) => {
			return (
				event.type === "routing_decision" && agentSet.has(event.target_agent)
			);
		});
	}

	/**
	 * Filter events by matcher types
	 * @param matcherTypes - Array of matcher types to include
	 */
	filterByMatcherTypes(matcherTypes: string[]): AnalyticsEvent[] {
		const matcherSet = new Set(matcherTypes);
		return this.events.filter((event) => {
			return (
				event.type === "routing_decision" && matcherSet.has(event.matcher_type)
			);
		});
	}

	/**
	 * Compute aggregated metrics for all events
	 * Returns agent metrics, matcher metrics, and summary statistics
	 * @param options - Optional aggregation options for filtering
	 */
	aggregate(options?: Partial<AggregationOptions>): AggregationResult {
		// Apply filtering based on options
		let filteredEvents = this.events;

		if (options?.start_date && options?.end_date) {
			const startDate = new Date(options.start_date);
			const endDate = new Date(options.end_date);
			filteredEvents = filteredEvents.filter((event) => {
				const eventTime = new Date(event.timestamp).getTime();
				return (
					eventTime >= startDate.getTime() && eventTime <= endDate.getTime()
				);
			});
		}

		if (options?.agent_names && options.agent_names.length > 0) {
			filteredEvents = filteredEvents.filter((event) => {
				return (
					event.type === "routing_decision" &&
					options.agent_names!.includes(event.target_agent)
				);
			});
		}

		if (options?.matcher_types && options.matcher_types.length > 0) {
			filteredEvents = filteredEvents.filter((event) => {
				return (
					event.type === "routing_decision" &&
					options.matcher_types!.includes(event.matcher_type)
				);
			});
		}

		// Initialize result
		const result = createAggregationResult();
		result.total_events = filteredEvents.length;

		// Separate events by type
		const routingDecisions = filteredEvents.filter(isRoutingDecisionEvent);
		const unmatchedRequests = filteredEvents.filter(isUnmatchedRequestEvent);

		result.routing_decisions = routingDecisions.length;
		result.unmatched_requests = unmatchedRequests.length;

		// Compute agent metrics
		const agentStats = this.computeAgentStatistics(routingDecisions);
		for (const [agentName, stats] of Object.entries(agentStats)) {
			result.agent_metrics[agentName] = {
				agent_name: stats.agent_name,
				total_requests: stats.total_requests,
				successful_requests: stats.successful_requests,
				failed_requests: stats.failed_requests,
				last_used: stats.last_used,
				average_request_duration_ms: undefined,
			};
		}

		// Compute matcher metrics
		const matcherStats = this.computeMatcherStatistics(routingDecisions);
		for (const [matcherType, stats] of Object.entries(matcherStats)) {
			result.matcher_metrics[matcherType] = {
				matcher_type: stats.matcher_type,
				total_evaluations: stats.total_evaluations,
				matched_count: stats.matched_count,
				not_matched_count: stats.not_matched_count,
				match_rate: stats.match_rate,
				target_agents: stats.target_agents,
			};
		}

		// Get top agents by total requests
		result.top_agents = Object.entries(result.agent_metrics)
			.sort(([, a], [, b]) => b.total_requests - a.total_requests)
			.map(([agentName]) => agentName);

		// Get top matchers by match count
		result.top_matchers = Object.entries(result.matcher_metrics)
			.sort(([, a], [, b]) => b.matched_count - a.matched_count)
			.map(([matcherType]) => matcherType);

		return result;
	}

	/**
	 * Compute agent usage statistics
	 * For each agent, calculates total requests, success rate, and last used timestamp
	 * Also tracks which meta-agents delegate to each agent
	 * @param events - Routing decision events to analyze
	 */
	computeAgentStatistics(
		events: RoutingDecisionEvent[],
	): Record<string, AgentStatistics> {
		const agentStats: Record<string, AgentStatistics> = {};

		for (const event of events) {
			const agentName = event.target_agent;

			// Initialize agent stats if needed
			if (!agentStats[agentName]) {
				agentStats[agentName] = {
					agent_name: agentName,
					total_requests: 0,
					successful_requests: 0,
					failed_requests: 0,
					success_rate: 0,
					last_used: event.timestamp,
					meta_agents: {},
				};
			}

			// Increment total requests
			agentStats[agentName].total_requests += 1;

			// Track meta-agent usage if specified
			if (event.meta_agent) {
				agentStats[agentName].meta_agents[event.meta_agent] =
					(agentStats[agentName].meta_agents[event.meta_agent] ?? 0) + 1;
			}

			// Update last used timestamp
			if (
				!agentStats[agentName].last_used ||
				event.timestamp > agentStats[agentName].last_used
			) {
				agentStats[agentName].last_used = event.timestamp;
			}

			// For routing decisions, assume successful (unmatched requests are separate events)
			// If we want to track failures, we'd need additional event data
			agentStats[agentName].successful_requests += 1;
		}

		// Calculate success rates
		for (const stats of Object.values(agentStats)) {
			if (stats.total_requests > 0) {
				stats.success_rate = stats.successful_requests / stats.total_requests;
			} else {
				stats.success_rate = 0;
			}
		}

		return agentStats;
	}

	/**
	 * Compute matcher effectiveness statistics
	 * For each matcher type, calculates evaluation count, match count, and match rate
	 * Also tracks which agents each matcher routes to
	 * @param events - Routing decision events to analyze
	 */
	computeMatcherStatistics(
		events: RoutingDecisionEvent[],
	): Record<string, MatcherStatistics> {
		const matcherStats: Record<string, MatcherStatistics> = {};

		for (const event of events) {
			const matcherType = event.matcher_type;

			// Initialize matcher stats if needed
			if (!matcherStats[matcherType]) {
				matcherStats[matcherType] = {
					matcher_type: matcherType,
					total_evaluations: 0,
					matched_count: 0,
					not_matched_count: 0,
					match_rate: 0,
					target_agents: {},
				};
			}

			// Increment total evaluations (every routing decision is a matched evaluation)
			matcherStats[matcherType].total_evaluations += 1;
			matcherStats[matcherType].matched_count += 1;

			// Track target agent
			const targetAgent = event.target_agent;
			matcherStats[matcherType].target_agents[targetAgent] =
				(matcherStats[matcherType].target_agents[targetAgent] ?? 0) + 1;
		}

		// Calculate match rates
		for (const stats of Object.values(matcherStats)) {
			if (stats.total_evaluations > 0) {
				stats.match_rate = stats.matched_count / stats.total_evaluations;
			} else {
				stats.match_rate = 0;
			}

			// not_matched_count represents unmatched requests before this matcher
			// This would be tracked separately from routing decisions
			stats.not_matched_count = 0;
		}

		return matcherStats;
	}

	/**
	 * Generate time series data for routing decisions over time
	 * Groups events by time interval (hour, day, week, month)
	 * @param interval - Time interval for grouping
	 * @param startDate - Start date for time series
	 * @param endDate - End date for time series
	 */
	generateTimeSeries(
		interval: "hour" | "day" | "week" | "month",
		startDate: Date,
		endDate: Date,
	): TimeSeriesAggregation {
		const result = createTimeSeriesAggregation(
			startDate.toISOString(),
			endDate.toISOString(),
			interval,
		);

		const routingDecisions = this.events.filter(isRoutingDecisionEvent);

		// Filter by date range
		const filteredEvents = routingDecisions.filter((event) => {
			const eventTime = new Date(event.timestamp).getTime();
			return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
		});

		// Group events by time interval
		const timeSeries: Record<string, number> = {};

		for (const event of filteredEvents) {
			const eventDate = new Date(event.timestamp);
			const timeKey = this.getTimeKey(eventDate, interval);

			timeSeries[timeKey] = (timeSeries[timeKey] ?? 0) + 1;
		}

		// Convert to time series data points
		result.series.requests = Object.entries(timeSeries)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([timestamp, value]) => ({
				timestamp,
				value,
			}));

		return result;
	}

	/**
	 * Get time key for grouping events
	 * @param date - Date to generate key for
	 * @param interval - Time interval
	 */
	private getTimeKey(
		date: Date,
		interval: "hour" | "day" | "week" | "month",
	): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hour = String(date.getHours()).padStart(2, "0");

		switch (interval) {
			case "hour":
				return `${year}-${month}-${day}T${hour}:00:00.000Z`;
			case "day":
				return `${year}-${month}-${day}T00:00:00.000Z`;
			case "week": {
				// Get week number
				const weekNumber = this.getWeekNumber(date);
				return `${year}-W${String(weekNumber).padStart(2, "0")}`;
			}
			case "month":
				return `${year}-${month}-01T00:00:00.000Z`;
			default:
				return date.toISOString();
		}
	}

	/**
	 * Get week number for a date
	 * @param date - Date to get week number for
	 */
	private getWeekNumber(date: Date): number {
		const d = new Date(
			Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
		);
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	/**
	 * Get summary statistics for all events
	 */
	getSummary(): {
		total_events: number;
		routing_decisions: number;
		unmatched_requests: number;
		unique_agents: number;
		unique_matchers: number;
		unique_meta_agents: number;
	} {
		const routingDecisions = this.getRoutingDecisionEvents();
		const unmatchedRequests = this.getUnmatchedRequestEvents();

		const uniqueAgents = new Set(routingDecisions.map((e) => e.target_agent))
			.size;

		const uniqueMatchers = new Set(routingDecisions.map((e) => e.matcher_type))
			.size;

		const uniqueMetaAgents = new Set(
			routingDecisions
				.map((e) => e.meta_agent)
				.filter((m): m is string => m !== undefined),
		).size;

		return {
			total_events: this.events.length,
			routing_decisions: routingDecisions.length,
			unmatched_requests: unmatchedRequests.length,
			unique_agents: uniqueAgents,
			unique_matchers: uniqueMatchers,
			unique_meta_agents: uniqueMetaAgents,
		};
	}

	/**
	 * Get top N agents by request count
	 * @param limit - Maximum number of agents to return
	 */
	getTopAgents(limit = 10): Array<{
		agent_name: string;
		total_requests: number;
	}> {
		const agentCounts: Record<string, number> = {};

		for (const event of this.events) {
			if (event.type === "routing_decision") {
				agentCounts[event.target_agent] =
					(agentCounts[event.target_agent] ?? 0) + 1;
			}
		}

		return Object.entries(agentCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([agent_name, total_requests]) => ({
				agent_name,
				total_requests,
			}));
	}

	/**
	 * Get top N matchers by match count
	 * @param limit - Maximum number of matchers to return
	 */
	getTopMatchers(limit = 10): Array<{
		matcher_type: string;
		match_count: number;
	}> {
		const matcherCounts: Record<string, number> = {};

		for (const event of this.events) {
			if (event.type === "routing_decision") {
				matcherCounts[event.matcher_type] =
					(matcherCounts[event.matcher_type] ?? 0) + 1;
			}
		}

		return Object.entries(matcherCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([matcher_type, match_count]) => ({
				matcher_type,
				match_count,
			}));
	}
}

/**
 * Convenience function to create an aggregator and compute metrics
 * @param events - Array of analytics events
 * @param options - Optional aggregation options
 */
export function aggregateAnalytics(
	events: AnalyticsEvent[],
	options?: Partial<AggregationOptions>,
): AggregationResult {
	const aggregator = new AnalyticsAggregator(events);
	return aggregator.aggregate(options);
}

/**
 * Convenience function to compute agent statistics
 * @param events - Array of analytics events
 */
export function computeAgentStatistics(
	events: AnalyticsEvent[],
): Record<string, AgentStatistics> {
	const aggregator = new AnalyticsAggregator(events);
	return aggregator.computeAgentStatistics(
		aggregator.getRoutingDecisionEvents(),
	);
}

/**
 * Convenience function to compute matcher statistics
 * @param events - Array of analytics events
 */
export function computeMatcherStatistics(
	events: AnalyticsEvent[],
): Record<string, MatcherStatistics> {
	const aggregator = new AnalyticsAggregator(events);
	return aggregator.computeMatcherStatistics(
		aggregator.getRoutingDecisionEvents(),
	);
}
