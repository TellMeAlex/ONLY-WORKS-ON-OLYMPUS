import { test, expect, describe } from "bun:test";
import type {
  AnalyticsEvent,
  RoutingDecisionEvent,
} from "./types.js";
import {
  AnalyticsAggregator,
  computeAgentStatistics,
  computeMatcherStatistics,
  aggregateAnalytics,
  createAggregationResult,
  createAgentUsageMetrics,
  createMatcherEffectivenessMetrics,
  createTimeSeriesAggregation,
  isRoutingDecisionEvent,
  isUnmatchedRequestEvent,
  type AgentStatistics,
  type MatcherStatistics,
  type AggregationResult,
  type TimeSeriesAggregation,
} from "./aggregator.js";

describe("AnalyticsAggregator", () => {
  describe("constructor and basic methods", () => {
    test("creates aggregator with events", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      expect(aggregator).toBeDefined();
    });

    test("updates events", () => {
      const aggregator = new AnalyticsAggregator([]);
      const newEvents: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      aggregator.updateEvents(newEvents);
      expect(aggregator.getRoutingDecisionEvents()).toHaveLength(1);
    });

    test("gets routing decision events", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "unmatched_request",
          timestamp: "2024-01-01T00:01:00.000Z",
          user_request: "test",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const routingEvents = aggregator.getRoutingDecisionEvents();
      expect(routingEvents).toHaveLength(1);
      expect(routingEvents[0]!.type).toBe("routing_decision");
    });

    test("gets unmatched request events", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "unmatched_request",
          timestamp: "2024-01-01T00:01:00.000Z",
          user_request: "test",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const unmatchedEvents = aggregator.getUnmatchedRequestEvents();
      expect(unmatchedEvents).toHaveLength(1);
      expect(unmatchedEvents[0]!.type).toBe("unmatched_request");
    });
  });

  describe("filterByDateRange", () => {
    test("filters events by date range", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-02T00:00:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-03T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-2",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const filtered = aggregator.filterByDateRange(
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2024-01-02T00:00:00.000Z")
      );
      expect(filtered).toHaveLength(2);
    });

    test("returns empty array when no events match", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const filtered = aggregator.filterByDateRange(
        new Date("2024-02-01T00:00:00.000Z"),
        new Date("2024-02-02T00:00:00.000Z")
      );
      expect(filtered).toHaveLength(0);
    });
  });

  describe("filterByAgents", () => {
    test("filters events by agent names", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-02T00:00:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-03T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-2",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const filtered = aggregator.filterByAgents(["agent-1"]);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.type === "routing_decision" && e.target_agent === "agent-1")).toBe(true);
    });
  });

  describe("filterByMatcherTypes", () => {
    test("filters events by matcher types", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-02T00:00:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-03T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-2",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const filtered = aggregator.filterByMatcherTypes(["matcher-1"]);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.type === "routing_decision" && e.matcher_type === "matcher-1")).toBe(true);
    });
  });

  describe("computeAgentStatistics", () => {
    test("calculates agent usage statistics for single agent", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-2",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeAgentStatistics(events);

      expect(stats["agent-1"]).toBeDefined();
      expect(stats["agent-1"]!.agent_name).toBe("agent-1");
      expect(stats["agent-1"]!.total_requests).toBe(3);
      expect(stats["agent-1"]!.successful_requests).toBe(3);
      expect(stats["agent-1"]!.failed_requests).toBe(0);
      expect(stats["agent-1"]!.success_rate).toBe(1);
      expect(stats["agent-1"]!.last_used).toBe("2024-01-01T00:02:00.000Z");
    });

    test("calculates statistics for multiple agents", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-2",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeAgentStatistics(events);

      expect(stats["agent-1"]).toBeDefined();
      expect(stats["agent-1"]!.total_requests).toBe(2);
      expect(stats["agent-2"]).toBeDefined();
      expect(stats["agent-2"]!.total_requests).toBe(1);
    });

    test("tracks meta-agent usage", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
          meta_agent: "meta-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
          meta_agent: "meta-2",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-2",
          meta_agent: "meta-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeAgentStatistics(events);

      expect(stats["agent-1"]!.meta_agents["meta-1"]).toBe(2);
      expect(stats["agent-1"]!.meta_agents["meta-2"]).toBe(1);
    });

    test("handles empty events array", () => {
      const aggregator = new AnalyticsAggregator([]);
      const stats = aggregator.computeAgentStatistics([]);

      expect(stats).toEqual({});
    });

    test("calculates correct success rate", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeAgentStatistics(events);

      expect(stats["agent-1"]!.success_rate).toBe(1);
    });

    test("updates last_used timestamp correctly", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeAgentStatistics(events);

      expect(stats["agent-1"]!.last_used).toBe("2024-01-01T00:02:00.000Z");
    });
  });

  describe("computeMatcherStatistics", () => {
    test("calculates matcher effectiveness for single matcher", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeMatcherStatistics(events);

      expect(stats["matcher-1"]).toBeDefined();
      expect(stats["matcher-1"]!.matcher_type).toBe("matcher-1");
      expect(stats["matcher-1"]!.total_evaluations).toBe(2);
      expect(stats["matcher-1"]!.matched_count).toBe(2);
      expect(stats["matcher-1"]!.not_matched_count).toBe(0);
      expect(stats["matcher-1"]!.match_rate).toBe(1);
    });

    test("tracks target agents for matcher", () => {
      const events: RoutingDecisionEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const stats = aggregator.computeMatcherStatistics(events);

      expect(stats["matcher-1"]!.target_agents["agent-1"]).toBe(2);
      expect(stats["matcher-1"]!.target_agents["agent-2"]).toBe(1);
    });

    test("handles empty events array", () => {
      const aggregator = new AnalyticsAggregator([]);
      const stats = aggregator.computeMatcherStatistics([]);

      expect(stats).toEqual({});
    });
  });

  describe("aggregate", () => {
    test("aggregates all events without options", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "unmatched_request",
          timestamp: "2024-01-01T00:01:00.000Z",
          user_request: "test",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const result = aggregator.aggregate();

      expect(result.total_events).toBe(2);
      expect(result.routing_decisions).toBe(1);
      expect(result.unmatched_requests).toBe(1);
      expect(Object.keys(result.agent_metrics)).toContain("agent-1");
    });

    test("filters by date range when options provided", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-02-01T00:00:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const result = aggregator.aggregate({
        start_date: "2024-01-01T00:00:00.000Z",
        end_date: "2024-01-31T23:59:59.999Z",
      });

      expect(result.total_events).toBe(1);
      expect(result.routing_decisions).toBe(1);
    });

    test("filters by agent names when options provided", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const result = aggregator.aggregate({
        agent_names: ["agent-1"],
      });

      expect(result.total_events).toBe(1);
      expect(result.routing_decisions).toBe(1);
    });

    test("populates top_agents and top_matchers", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const result = aggregator.aggregate();

      expect(result.top_agents).toHaveLength(2);
      expect(result.top_agents[0]).toBe("agent-1"); // Most requests
      expect(result.top_matchers).toHaveLength(1);
      expect(result.top_matchers[0]).toBe("matcher-1");
    });
  });

  describe("generateTimeSeries", () => {
    test("generates time series with day interval", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-02T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const result = aggregator.generateTimeSeries(
        "day",
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2024-01-02T23:59:59.999Z")
      );

      expect(result.series.requests).toBeDefined();
      expect(result.series.requests).toHaveLength(2);
      expect(result.interval).toBe("day");
    });

    test("generates time series with hour interval", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T01:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const result = aggregator.generateTimeSeries(
        "hour",
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2024-01-01T23:59:59.999Z")
      );

      expect(result.series.requests).toBeDefined();
      expect(result.series.requests).toHaveLength(2);
      expect(result.interval).toBe("hour");
    });
  });

  describe("getSummary", () => {
    test("returns summary statistics", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
          meta_agent: "meta-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-2",
        },
        {
          type: "unmatched_request",
          timestamp: "2024-01-01T00:02:00.000Z",
          user_request: "test",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const summary = aggregator.getSummary();

      expect(summary.total_events).toBe(3);
      expect(summary.routing_decisions).toBe(2);
      expect(summary.unmatched_requests).toBe(1);
      expect(summary.unique_agents).toBe(2);
      expect(summary.unique_matchers).toBe(2);
      expect(summary.unique_meta_agents).toBe(1);
    });
  });

  describe("getTopAgents", () => {
    test("returns top agents by request count", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const topAgents = aggregator.getTopAgents(2);

      expect(topAgents).toHaveLength(2);
      expect(topAgents[0]!.agent_name).toBe("agent-1");
      expect(topAgents[0]!.total_requests).toBe(2);
      expect(topAgents[1]!.agent_name).toBe("agent-2");
      expect(topAgents[1]!.total_requests).toBe(1);
    });

    test("respects limit parameter", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-3",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const topAgents = aggregator.getTopAgents(2);

      expect(topAgents).toHaveLength(2);
    });
  });

  describe("getTopMatchers", () => {
    test("returns top matchers by match count", () => {
      const events: AnalyticsEvent[] = [
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:00:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:01:00.000Z",
          target_agent: "agent-2",
          matcher_type: "matcher-2",
        },
        {
          type: "routing_decision",
          timestamp: "2024-01-01T00:02:00.000Z",
          target_agent: "agent-1",
          matcher_type: "matcher-1",
        },
      ];
      const aggregator = new AnalyticsAggregator(events);
      const topMatchers = aggregator.getTopMatchers(2);

      expect(topMatchers).toHaveLength(2);
      expect(topMatchers[0]!.matcher_type).toBe("matcher-1");
      expect(topMatchers[0]!.match_count).toBe(2);
      expect(topMatchers[1]!.matcher_type).toBe("matcher-2");
      expect(topMatchers[1]!.match_count).toBe(1);
    });
  });
});

describe("factory functions", () => {
  test("createAggregationResult creates empty result", () => {
    const result = createAggregationResult();

    expect(result.total_events).toBe(0);
    expect(result.routing_decisions).toBe(0);
    expect(result.unmatched_requests).toBe(0);
    expect(result.agent_metrics).toEqual({});
    expect(result.matcher_metrics).toEqual({});
    expect(result.top_agents).toEqual([]);
    expect(result.top_matchers).toEqual([]);
  });

  test("createAgentUsageMetrics creates metrics for agent", () => {
    const metrics = createAgentUsageMetrics("test-agent");

    expect(metrics.agent_name).toBe("test-agent");
    expect(metrics.total_requests).toBe(0);
    expect(metrics.successful_requests).toBe(0);
    expect(metrics.failed_requests).toBe(0);
    expect(metrics.last_used).toBeUndefined();
    expect(metrics.average_request_duration_ms).toBeUndefined();
  });

  test("createMatcherEffectivenessMetrics creates metrics for matcher", () => {
    const metrics = createMatcherEffectivenessMetrics("test-matcher");

    expect(metrics.matcher_type).toBe("test-matcher");
    expect(metrics.total_evaluations).toBe(0);
    expect(metrics.matched_count).toBe(0);
    expect(metrics.not_matched_count).toBe(0);
    expect(metrics.match_rate).toBe(0);
    expect(metrics.target_agents).toEqual({});
  });

  test("createTimeSeriesAggregation creates time series", () => {
    const result = createTimeSeriesAggregation(
      "2024-01-01T00:00:00.000Z",
      "2024-01-31T23:59:59.999Z",
      "day"
    );

    expect(result.start_date).toBe("2024-01-01T00:00:00.000Z");
    expect(result.end_date).toBe("2024-01-31T23:59:59.999Z");
    expect(result.interval).toBe("day");
    expect(result.series).toEqual({});
  });
});

describe("type guards", () => {
  test("isRoutingDecisionEvent correctly identifies routing decisions", () => {
    const event1: AnalyticsEvent = {
      type: "routing_decision",
      timestamp: "2024-01-01T00:00:00.000Z",
      target_agent: "agent-1",
      matcher_type: "matcher-1",
    };
    const event2: AnalyticsEvent = {
      type: "unmatched_request",
      timestamp: "2024-01-01T00:00:00.000Z",
      user_request: "test",
    };

    expect(isRoutingDecisionEvent(event1)).toBe(true);
    expect(isRoutingDecisionEvent(event2)).toBe(false);
  });

  test("isUnmatchedRequestEvent correctly identifies unmatched requests", () => {
    const event1: AnalyticsEvent = {
      type: "routing_decision",
      timestamp: "2024-01-01T00:00:00.000Z",
      target_agent: "agent-1",
      matcher_type: "matcher-1",
    };
    const event2: AnalyticsEvent = {
      type: "unmatched_request",
      timestamp: "2024-01-01T00:00:00.000Z",
      user_request: "test",
    };

    expect(isUnmatchedRequestEvent(event1)).toBe(false);
    expect(isUnmatchedRequestEvent(event2)).toBe(true);
  });
});

describe("convenience functions", () => {
  test("aggregateAnalytics creates aggregator and returns result", () => {
    const events: AnalyticsEvent[] = [
      {
        type: "routing_decision",
        timestamp: "2024-01-01T00:00:00.000Z",
        target_agent: "agent-1",
        matcher_type: "matcher-1",
      },
    ];
    const result = aggregateAnalytics(events);

    expect(result.total_events).toBe(1);
    expect(result.routing_decisions).toBe(1);
  });

  test("computeAgentStatistics convenience function works", () => {
    const events: AnalyticsEvent[] = [
      {
        type: "routing_decision",
        timestamp: "2024-01-01T00:00:00.000Z",
        target_agent: "agent-1",
        matcher_type: "matcher-1",
      },
    ];
    const stats = computeAgentStatistics(events);

    expect(stats["agent-1"]).toBeDefined();
    expect(stats["agent-1"]!.total_requests).toBe(1);
  });

  test("computeMatcherStatistics convenience function works", () => {
    const events: AnalyticsEvent[] = [
      {
        type: "routing_decision",
        timestamp: "2024-01-01T00:00:00.000Z",
        target_agent: "agent-1",
        matcher_type: "matcher-1",
      },
    ];
    const stats = computeMatcherStatistics(events);

    expect(stats["matcher-1"]).toBeDefined();
    expect(stats["matcher-1"]!.total_evaluations).toBe(1);
  });
});
