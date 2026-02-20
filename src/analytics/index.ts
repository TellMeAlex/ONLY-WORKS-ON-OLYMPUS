// Types
export type {
  RoutingDecisionEvent,
  UnmatchedRequestEvent,
  AnalyticsEvent,
  AgentUsageMetrics,
  MatcherEffectivenessMetrics,
  TimeSeriesDataPoint,
  AnalyticsData,
  AggregationOptions,
  ExportFormat,
  ExportOptions,
  DisplayOptions,
  AnalyticsConfig,
} from "./types.js";

// Schemas
export {
  RoutingDecisionEventSchema,
  UnmatchedRequestEventSchema,
  AnalyticsEventSchema,
  AgentUsageMetricsSchema,
  MatcherEffectivenessMetricsSchema,
  TimeSeriesDataPointSchema,
  AnalyticsDataSchema,
  AggregationOptionsSchema,
  ExportFormatSchema,
  ExportOptionsSchema,
  DisplayOptionsSchema,
  AnalyticsConfigSchema,
} from "./types.js";

// Storage
export type { AnalyticsData as StorageAnalyticsData } from "./storage.js";
export { AnalyticsStorage } from "./storage.js";

// Aggregator
export type {
  AggregationResult,
  TimeSeriesAggregation,
  AgentStatistics,
  MatcherStatistics,
} from "./aggregator.js";
export {
  AnalyticsAggregator,
  createAggregationResult,
  createAgentUsageMetrics,
  createMatcherEffectivenessMetrics,
  createTimeSeriesAggregation,
  isRoutingDecisionEvent,
  isUnmatchedRequestEvent,
  aggregateAnalytics,
  computeAgentStatistics,
  computeMatcherStatistics,
} from "./aggregator.js";

// Exporter
export type { ExportResult } from "./exporter.js";
export {
  AnalyticsExporter,
  exportToJson,
  exportToCsv,
  exportToFile,
} from "./exporter.js";

// Dashboard
export type { DashboardOutput, FormattedMetrics } from "./dashboard.js";
export {
  AnalyticsDashboard,
  displayAnalytics,
  getFormattedAnalytics,
} from "./dashboard.js";
