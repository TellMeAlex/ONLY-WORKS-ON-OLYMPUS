import { z } from "zod";
import type {
  AnalyticsEvent,
  RoutingDecisionEvent,
  UnmatchedRequestEvent,
  AgentUsageMetrics,
  MatcherEffectivenessMetrics,
  DisplayOptions,
} from "./types.js";
import {
  AnalyticsAggregator,
  type AggregationResult,
  type AgentStatistics,
  type MatcherStatistics,
} from "./aggregator.js";

/**
 * Dashboard Output Schema - Result of a display operation
 */
export const DashboardOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  total_events: z.number().int().nonnegative(),
  agent_count: z.number().int().nonnegative(),
  matcher_count: z.number().int().nonnegative(),
  unmatched_count: z.number().int().nonnegative(),
});

export type DashboardOutput = z.infer<typeof DashboardOutputSchema>;

/**
 * Formatted Metrics Schema - Display-ready metrics data
 */
export const FormattedMetricsSchema = z.object({
  summary: z.object({
    total_events: z.number().int().nonnegative(),
    routing_decisions: z.number().int().nonnegative(),
    unmatched_requests: z.number().int().nonnegative(),
    unique_agents: z.number().int().nonnegative(),
    unique_matchers: z.number().int().nonnegative(),
    unique_meta_agents: z.number().int().nonnegative(),
    date_range: z
      .object({
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
      })
      .optional(),
  }),
  top_agents: z.array(
    z.object({
      name: z.string(),
      requests: z.number().int().nonnegative(),
      success_rate: z.number().min(0).max(1),
    })
  ),
  top_matchers: z.array(
    z.object({
      type: z.string(),
      evaluations: z.number().int().nonnegative(),
      match_rate: z.number().min(0).max(1),
    })
  ),
  agent_details: z.record(
    z.string(),
    z.object({
      total_requests: z.number().int().nonnegative(),
      successful_requests: z.number().int().nonnegative(),
      failed_requests: z.number().int().nonnegative(),
      success_rate: z.number().min(0).max(1),
      last_used: z.string().datetime().optional(),
      meta_agents: z.record(z.string(), z.number().int().nonnegative()),
    })
  ),
  matcher_details: z.record(
    z.string(),
    z.object({
      total_evaluations: z.number().int().nonnegative(),
      matched_count: z.number().int().nonnegative(),
      not_matched_count: z.number().int().nonnegative(),
      match_rate: z.number().min(0).max(1),
      target_agents: z.record(z.string(), z.number().int().nonnegative()),
    })
  ),
  unmatched_requests: z.array(
    z.object({
      timestamp: z.string().datetime(),
      user_request: z.string(),
      meta_agent: z.string().optional(),
    })
  ),
});

export type FormattedMetrics = z.infer<typeof FormattedMetricsSchema>;

/**
 * AnalyticsDashboard class for displaying analytics metrics
 *
 * Provides formatted console output for analytics data including:
 * - Summary statistics (total events, unique agents/matchers)
 * - Agent usage metrics (requests, success rates, last used)
 * - Matcher effectiveness metrics (match rates, target agents)
 * - Unmatched request tracking
 *
 * The dashboard supports filtering, sorting, and limiting of displayed data.
 */
export class AnalyticsDashboard {
  private aggregator: AnalyticsAggregator;
  private defaultOptions: DisplayOptions;

  /**
   * Creates a new AnalyticsDashboard instance
   * @param events - Array of analytics events to display
   * @param options - Optional display options for customizing output
   */
  constructor(events: AnalyticsEvent[] = [], options?: Partial<DisplayOptions>) {
    this.aggregator = new AnalyticsAggregator(events);

    this.defaultOptions = {
      show_raw_events: false,
      show_agent_metrics: true,
      show_matcher_metrics: true,
      show_unmatched_requests: true,
      limit: undefined,
      sort_by: "timestamp",
      sort_order: "desc",
      ...options,
    };
  }

  /**
   * Update the events to display
   * @param events - New array of analytics events
   */
  updateEvents(events: AnalyticsEvent[]): void {
    this.aggregator.updateEvents(events);
  }

  /**
   * Get formatted metrics for display
   * @param options - Optional display options
   */
  getFormattedMetrics(options?: Partial<DisplayOptions>): FormattedMetrics {
    const displayOptions = { ...this.defaultOptions, ...options };

    // Get summary statistics
    const summary = this.aggregator.getSummary();

    // Get aggregation result
    const aggregation = this.aggregator.aggregate();

    // Get top agents
    const topAgents = this.getTopAgents(10, displayOptions);

    // Get top matchers
    const topMatchers = this.getTopMatchers(10, displayOptions);

    // Get agent details
    const agentDetails = this.getAgentDetails(displayOptions);

    // Get matcher details
    const matcherDetails = this.getMatcherDetails(displayOptions);

    // Get unmatched requests
    const unmatchedRequests = this.getUnmatchedRequests(displayOptions);

    // Calculate date range
    const routingDecisions = this.aggregator.getRoutingDecisionEvents();
    const allEvents = this.aggregator["events"] as AnalyticsEvent[];
    const dateRange = this.getDateRange(allEvents);

    return {
      summary: {
        total_events: summary.total_events,
        routing_decisions: summary.routing_decisions,
        unmatched_requests: summary.unmatched_requests,
        unique_agents: summary.unique_agents,
        unique_matchers: summary.unique_matchers,
        unique_meta_agents: summary.unique_meta_agents,
        date_range: dateRange,
      },
      top_agents: topAgents,
      top_matchers: topMatchers,
      agent_details: agentDetails,
      matcher_details: matcherDetails,
      unmatched_requests: unmatchedRequests,
    };
  }

  /**
   * Display metrics to console with formatted output
   * @param options - Optional display options
   * @returns Dashboard output with success status
   */
  display(options?: Partial<DisplayOptions>): DashboardOutput {
    const metrics = this.getFormattedMetrics(options);

    // Display summary
    this.displaySummary(metrics.summary);

    // Display top agents
    if (metrics.top_agents.length > 0) {
      this.displayTopAgents(metrics.top_agents);
    }

    // Display top matchers
    if (metrics.top_matchers.length > 0) {
      this.displayTopMatchers(metrics.top_matchers);
    }

    // Display unmatched requests if enabled and present
    const displayOptions = { ...this.defaultOptions, ...options };
    if (displayOptions.show_unmatched_requests && metrics.unmatched_requests.length > 0) {
      this.displayUnmatchedRequests(metrics.unmatched_requests, displayOptions);
    }

    return {
      success: true,
      message: "Dashboard displayed successfully",
      total_events: metrics.summary.total_events,
      agent_count: metrics.summary.unique_agents,
      matcher_count: metrics.summary.unique_matchers,
      unmatched_count: metrics.summary.unmatched_requests,
    };
  }

  /**
   * Display summary section
   * @param summary - Summary statistics
   */
  private displaySummary(summary: FormattedMetrics["summary"]): void {
    console.log("\n📊 Analytics Summary");
    console.log("─".repeat(40));
    console.log(`Total Events:          ${summary.total_events}`);
    console.log(`Routing Decisions:     ${summary.routing_decisions}`);
    console.log(`Unmatched Requests:    ${summary.unmatched_requests}`);
    console.log(`Unique Agents:         ${summary.unique_agents}`);
    console.log(`Unique Matchers:       ${summary.unique_matchers}`);
    console.log(`Unique Meta-Agents:    ${summary.unique_meta_agents}`);

    if (summary.date_range?.start && summary.date_range?.end) {
      const startDate = new Date(summary.date_range.start).toLocaleDateString();
      const endDate = new Date(summary.date_range.end).toLocaleDateString();
      console.log(`Date Range:           ${startDate} to ${endDate}`);
    }
  }

  /**
   * Display top agents section
   * @param agents - Array of top agents
   */
  private displayTopAgents(agents: Array<{ name: string; requests: number; success_rate: number }>): void {
    console.log("\n🎯 Top Agents");
    console.log("─".repeat(40));

    if (agents.length === 0) {
      console.log("No agents found.");
      return;
    }

    // Calculate column widths
    const maxNameWidth = Math.max(...agents.map((a) => a.name.length), 4);
    const nameHeader = "Agent".padEnd(maxNameWidth);
    const requestsHeader = "Requests";
    const rateHeader = "Success Rate";

    console.log(`${nameHeader}  ${requestsHeader}  ${rateHeader}`);
    console.log("─".repeat(maxNameWidth + 20));

    for (const agent of agents) {
      const name = agent.name.padEnd(maxNameWidth);
      const requests = String(agent.requests).padStart(8);
      const rate = `${(agent.success_rate * 100).toFixed(1)}%`.padStart(13);
      console.log(`${name}  ${requests}  ${rate}`);
    }
  }

  /**
   * Display top matchers section
   * @param matchers - Array of top matchers
   */
  private displayTopMatchers(matchers: Array<{ type: string; evaluations: number; match_rate: number }>): void {
    console.log("\n🔍 Top Matchers");
    console.log("─".repeat(40));

    if (matchers.length === 0) {
      console.log("No matchers found.");
      return;
    }

    // Calculate column widths
    const maxTypeWidth = Math.max(...matchers.map((m) => m.type.length), 7);
    const typeHeader = "Matcher".padEnd(maxTypeWidth);
    const evalHeader = "Evaluations";
    const rateHeader = "Match Rate";

    console.log(`${typeHeader}  ${evalHeader}  ${rateHeader}`);
    console.log("─".repeat(maxTypeWidth + 25));

    for (const matcher of matchers) {
      const type = matcher.type.padEnd(maxTypeWidth);
      const evaluations = String(matcher.evaluations).padStart(12);
      const rate = `${(matcher.match_rate * 100).toFixed(1)}%`.padStart(11);
      console.log(`${type}  ${evaluations}  ${rate}`);
    }
  }

  /**
   * Display unmatched requests section
   * @param requests - Array of unmatched requests
   * @param options - Display options
   */
  private displayUnmatchedRequests(
    requests: Array<{ timestamp: string; user_request: string; meta_agent?: string }>,
    options: DisplayOptions
  ): void {
    console.log("\n⚠️ Unmatched Requests");
    console.log("─".repeat(40));

    if (requests.length === 0) {
      console.log("No unmatched requests found.");
      return;
    }

    const displayRequests = this.limitAndSortRequests(requests, options);

    displayRequests.forEach((request, i) => {
      const timestamp = new Date(request.timestamp).toLocaleString();
      const metaAgentInfo = request.meta_agent ? ` (${request.meta_agent})` : "";

      console.log(`\n${i + 1}. [${timestamp}]${metaAgentInfo}`);
      console.log(`   ${request.user_request}`);
    });

    if (requests.length > displayRequests.length) {
      console.log(`\n... and ${requests.length - displayRequests.length} more unmatched requests`);
    }
  }

  /**
   * Get top N agents by request count
   * @param limit - Maximum number of agents to return
   * @param options - Display options
   */
  private getTopAgents(
    limit: number,
    options: DisplayOptions
  ): Array<{ name: string; requests: number; success_rate: number }> {
    const agentStats = this.aggregator.computeAgentStatistics(
      this.aggregator.getRoutingDecisionEvents()
    );

    return Object.entries(agentStats)
      .map(([agentName, stats]) => ({
        name: agentName,
        requests: stats.total_requests,
        success_rate: stats.success_rate,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  /**
   * Get top N matchers by evaluation count
   * @param limit - Maximum number of matchers to return
   * @param options - Display options
   */
  private getTopMatchers(
    limit: number,
    options: DisplayOptions
  ): Array<{ type: string; evaluations: number; match_rate: number }> {
    const matcherStats = this.aggregator.computeMatcherStatistics(
      this.aggregator.getRoutingDecisionEvents()
    );

    return Object.entries(matcherStats)
      .map(([matcherType, stats]) => ({
        type: matcherType,
        evaluations: stats.total_evaluations,
        match_rate: stats.match_rate,
      }))
      .sort((a, b) => b.evaluations - a.evaluations)
      .slice(0, limit);
  }

  /**
   * Get detailed agent statistics
   * @param options - Display options
   */
  private getAgentDetails(options: DisplayOptions): Record<string, FormattedMetrics["agent_details"][string]> {
    const agentStats = this.aggregator.computeAgentStatistics(
      this.aggregator.getRoutingDecisionEvents()
    );

    const result: Record<string, FormattedMetrics["agent_details"][string]> = {};

    for (const [agentName, stats] of Object.entries(agentStats)) {
      result[agentName] = {
        total_requests: stats.total_requests,
        successful_requests: stats.successful_requests,
        failed_requests: stats.failed_requests,
        success_rate: stats.success_rate,
        last_used: stats.last_used,
        meta_agents: stats.meta_agents,
      };
    }

    return result;
  }

  /**
   * Get detailed matcher statistics
   * @param options - Display options
   */
  private getMatcherDetails(options: DisplayOptions): Record<string, FormattedMetrics["matcher_details"][string]> {
    const matcherStats = this.aggregator.computeMatcherStatistics(
      this.aggregator.getRoutingDecisionEvents()
    );

    const result: Record<string, FormattedMetrics["matcher_details"][string]> = {};

    for (const [matcherType, stats] of Object.entries(matcherStats)) {
      result[matcherType] = {
        total_evaluations: stats.total_evaluations,
        matched_count: stats.matched_count,
        not_matched_count: stats.not_matched_count,
        match_rate: stats.match_rate,
        target_agents: stats.target_agents,
      };
    }

    return result;
  }

  /**
   * Get unmatched requests with filtering and sorting
   * @param options - Display options
   */
  private getUnmatchedRequests(options: DisplayOptions): Array<{
    timestamp: string;
    user_request: string;
    meta_agent?: string;
  }> {
    const unmatchedEvents = this.aggregator.getUnmatchedRequestEvents();

    return unmatchedEvents.map((event) => ({
      timestamp: event.timestamp,
      user_request: event.user_request,
      meta_agent: event.meta_agent,
    }));
  }

  /**
   * Limit and sort unmatched requests based on options
   * @param requests - Array of unmatched requests
   * @param options - Display options
   */
  private limitAndSortRequests(
    requests: Array<{ timestamp: string; user_request: string; meta_agent?: string }>,
    options: DisplayOptions
  ): Array<{ timestamp: string; user_request: string; meta_agent?: string }> {
    let result = [...requests];

    // Sort by timestamp if specified
    if (options.sort_by === "timestamp") {
      result.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return options.sort_order === "desc" ? dateB - dateA : dateA - dateB;
      });
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Get date range from events
   * @param events - Array of analytics events
   */
  private getDateRange(events: AnalyticsEvent[]): { start: string; end: string } | undefined {
    if (events.length === 0) {
      return undefined;
    }

    const timestamps = events.map((e) => new Date(e.timestamp).getTime());
    const start = new Date(Math.min(...timestamps)).toISOString();
    const end = new Date(Math.max(...timestamps)).toISOString();

    return { start, end };
  }
}

/**
 * Convenience function to create a dashboard and display metrics
 * @param events - Array of analytics events
 * @param options - Optional display options
 */
export function displayAnalytics(
  events: AnalyticsEvent[],
  options?: Partial<DisplayOptions>
): DashboardOutput {
  const dashboard = new AnalyticsDashboard(events, options);
  return dashboard.display(options);
}

/**
 * Convenience function to create a dashboard and get formatted metrics
 * @param events - Array of analytics events
 * @param options - Optional display options
 */
export function getFormattedAnalytics(
  events: AnalyticsEvent[],
  options?: Partial<DisplayOptions>
): FormattedMetrics {
  const dashboard = new AnalyticsDashboard(events, options);
  return dashboard.getFormattedMetrics(options);
}
