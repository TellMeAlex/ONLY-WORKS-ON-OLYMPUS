import { z } from "zod";

/**
 * Analytics Event Types - Discriminated Union
 */

export const RoutingDecisionEventSchema = z.object({
  type: z.literal("routing_decision"),
  timestamp: z.string().datetime(),
  target_agent: z.string(),
  matcher_type: z.string(),
  matched_content: z.string().optional(),
  config_overrides: z
    .object({
      model: z.string().optional(),
      temperature: z.number().optional(),
      prompt: z.string().optional(),
      variant: z.string().optional(),
    })
    .optional(),
  meta_agent: z.string().optional(),
});

export const UnmatchedRequestEventSchema = z.object({
  type: z.literal("unmatched_request"),
  timestamp: z.string().datetime(),
  user_request: z.string(),
  meta_agent: z.string().optional(),
});

export const AnalyticsEventSchema = z.discriminatedUnion("type", [
  RoutingDecisionEventSchema,
  UnmatchedRequestEventSchema,
]);

/**
 * Agent Usage Metrics Schema
 */

export const AgentUsageMetricsSchema = z.object({
  agent_name: z.string(),
  total_requests: z.number().int().nonnegative(),
  successful_requests: z.number().int().nonnegative(),
  failed_requests: z.number().int().nonnegative(),
  last_used: z.string().datetime().optional(),
  average_request_duration_ms: z.number().nonnegative().optional(),
});

/**
 * Matcher Effectiveness Metrics Schema
 */

export const MatcherEffectivenessMetricsSchema = z.object({
  matcher_type: z.string(),
  total_evaluations: z.number().int().nonnegative(),
  matched_count: z.number().int().nonnegative(),
  not_matched_count: z.number().int().nonnegative(),
  match_rate: z.number().min(0).max(1),
  target_agents: z.record(z.string(), z.number().int().nonnegative()).optional(),
});

/**
 * Time Series Data Point Schema
 */

export const TimeSeriesDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
});

/**
 * Analytics Data Schema - Main Storage Structure
 */

export const AnalyticsDataSchema = z.object({
  events: z.array(AnalyticsEventSchema),
  agent_metrics: z.record(z.string(), AgentUsageMetricsSchema),
  matcher_metrics: z.record(z.string(), MatcherEffectivenessMetricsSchema),
  total_events: z.number().int().nonnegative(),
  first_event_timestamp: z.string().datetime().optional(),
  last_event_timestamp: z.string().datetime().optional(),
  version: z.string().default("1.0.0"),
});

/**
 * Analytics Aggregation Options Schema
 */

export const AggregationOptionsSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  group_by: z.enum(["hour", "day", "week", "month"]).optional(),
  agent_names: z.array(z.string()).optional(),
  matcher_types: z.array(z.string()).optional(),
});

/**
 * Analytics Export Options Schema
 */

export const ExportFormatSchema = z.enum(["json", "csv"]);

export const ExportOptionsSchema = z.object({
  format: ExportFormatSchema,
  include_raw_events: z.boolean().default(true),
  include_metrics: z.boolean().default(true),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  agent_names: z.array(z.string()).optional(),
  matcher_types: z.array(z.string()).optional(),
});

/**
 * Analytics Dashboard Display Options Schema
 */

export const DisplayOptionsSchema = z.object({
  show_raw_events: z.boolean().default(false),
  show_agent_metrics: z.boolean().default(true),
  show_matcher_metrics: z.boolean().default(true),
  show_unmatched_requests: z.boolean().default(true),
  limit: z.number().int().positive().optional(),
  sort_by: z.enum(["timestamp", "agent", "matcher"]).default("timestamp"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Analytics Configuration Schema
 */

export const AnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  storage_file: z.string().default("analytics.json"),
  max_events: z.number().int().positive().default(10000),
  retention_days: z.number().int().positive().default(90),
  auto_prune: z.boolean().default(true),
});

/**
 * Inferred TypeScript types from schemas
 */

export type RoutingDecisionEvent = z.infer<typeof RoutingDecisionEventSchema>;
export type UnmatchedRequestEvent = z.infer<typeof UnmatchedRequestEventSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

export type AgentUsageMetrics = z.infer<typeof AgentUsageMetricsSchema>;
export type MatcherEffectivenessMetrics = z.infer<
  typeof MatcherEffectivenessMetricsSchema
>;
export type TimeSeriesDataPoint = z.infer<typeof TimeSeriesDataPointSchema>;

export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

export type AggregationOptions = z.infer<typeof AggregationOptionsSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type DisplayOptions = z.infer<typeof DisplayOptionsSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;
