import { z } from "zod";
import type {
  AnalyticsEvent,
  PortfolioCreationEvent,
  PortfolioUpdateEvent,
  AssetAddedEvent,
  AssetRemovedEvent,
  PortfolioValueEvent,
  RebalancingEvent,
  TimeSeriesDataPoint,
} from "./types.js";

/**
 * Portfolio Summary Metrics Schema
 * Tracks summary statistics for a single portfolio
 */

export const PortfolioSummaryMetricsSchema = z.object({
  portfolio_id: z.string(),
  portfolio_name: z.string(),
  created_at: z.string().datetime().optional(),
  current_value: z.number().nonnegative().optional(),
  initial_value: z.number().nonnegative().optional(),
  total_return: z.number().optional(),
  daily_return: z.number().optional(),
  asset_count: z.number().int().nonnegative(),
  last_updated: z.string().datetime().optional(),
  currency: z.string().default("USD"),
  strategy: z.string().optional(),
});

/**
 * Asset Allocation Metrics Schema
 * Tracks allocation metrics by asset type
 */

export const AssetAllocationMetricsSchema = z.object({
  asset_type: z.enum(["stock", "bond", "etf", "crypto", "commodity", "cash", "other"]),
  total_value: z.number().nonnegative(),
  allocation_percentage: z.number().min(0).max(1),
  asset_count: z.number().int().nonnegative(),
  top_assets: z.array(z.string()),
});

/**
 * Rebalancing Statistics Schema
 * Tracks rebalancing activity for a portfolio
 */

export const RebalancingStatisticsSchema = z.object({
  portfolio_id: z.string(),
  portfolio_name: z.string(),
  total_rebalances: z.number().int().nonnegative(),
  by_trigger_reason: z.record(z.string(), z.number().int().nonnegative()),
  by_strategy: z.record(z.string(), z.number().int().nonnegative()),
  total_trades_executed: z.number().int().nonnegative(),
  last_rebalanced: z.string().datetime().optional(),
});

/**
 * Portfolio Aggregation Result Schema
 * Result of a portfolio aggregation operation
 */

export const PortfolioAggregationResultSchema = z.object({
  total_portfolios: z.number().int().nonnegative(),
  total_assets: z.number().int().nonnegative(),
  total_value: z.number().nonnegative(),
  portfolio_metrics: z.record(z.string(), PortfolioSummaryMetricsSchema),
  asset_allocation: z.record(z.string(), AssetAllocationMetricsSchema),
  rebalancing_metrics: z.record(z.string(), RebalancingStatisticsSchema),
  top_portfolios: z.array(z.string()),
  top_asset_types: z.array(z.string()),
});

/**
 * Cross-Portfolio Comparison Schema
 * Compares metrics across multiple portfolios
 */

export const CrossPortfolioComparisonSchema = z.object({
  portfolio_ids: z.array(z.string()),
  comparison_type: z.enum(["value", "return", "volatility", "asset_allocation"]),
  metrics: z.record(z.string(), z.number()),
  best_performing: z.string().optional(),
  worst_performing: z.string().optional(),
  average: z.number().optional(),
});

/**
 * Inferred TypeScript types from schemas
 */

export type PortfolioSummaryMetrics = z.infer<typeof PortfolioSummaryMetricsSchema>;
export type AssetAllocationMetrics = z.infer<typeof AssetAllocationMetricsSchema>;
export type RebalancingStatistics = z.infer<typeof RebalancingStatisticsSchema>;
export type PortfolioAggregationResult = z.infer<typeof PortfolioAggregationResultSchema>;
export type CrossPortfolioComparison = z.infer<typeof CrossPortfolioComparisonSchema>;

/**
 * Create portfolio aggregation result with default empty values
 */

export function createPortfolioAggregationResult(): PortfolioAggregationResult {
  return {
    total_portfolios: 0,
    total_assets: 0,
    total_value: 0,
    portfolio_metrics: {},
    asset_allocation: {},
    rebalancing_metrics: {},
    top_portfolios: [],
    top_asset_types: [],
  };
}

/**
 * Create portfolio summary metrics for a portfolio
 */

export function createPortfolioSummaryMetrics(
  portfolioId: string,
  portfolioName: string,
): PortfolioSummaryMetrics {
  return {
    portfolio_id: portfolioId,
    portfolio_name: portfolioName,
    created_at: undefined,
    current_value: undefined,
    initial_value: undefined,
    total_return: undefined,
    daily_return: undefined,
    asset_count: 0,
    last_updated: undefined,
    currency: "USD",
    strategy: undefined,
  };
}

/**
 * Create asset allocation metrics for an asset type
 */

export function createAssetAllocationMetrics(
  assetType: "stock" | "bond" | "etf" | "crypto" | "commodity" | "cash" | "other",
): AssetAllocationMetrics {
  return {
    asset_type: assetType,
    total_value: 0,
    allocation_percentage: 0,
    asset_count: 0,
    top_assets: [],
  };
}

/**
 * Create rebalancing statistics for a portfolio
 */

export function createRebalancingStatistics(
  portfolioId: string,
  portfolioName: string,
): RebalancingStatistics {
  return {
    portfolio_id: portfolioId,
    portfolio_name: portfolioName,
    total_rebalances: 0,
    by_trigger_reason: {},
    by_strategy: {},
    total_trades_executed: 0,
    last_rebalanced: undefined,
  };
}

/**
 * Create cross-portfolio comparison result
 */

export function createCrossPortfolioComparison(
  portfolioIds: string[],
  comparisonType: "value" | "return" | "volatility" | "asset_allocation",
): CrossPortfolioComparison {
  return {
    portfolio_ids: portfolioIds,
    comparison_type: comparisonType,
    metrics: {},
    best_performing: undefined,
    worst_performing: undefined,
    average: undefined,
  };
}

/**
 * Type guard functions for portfolio events
 */

export function isPortfolioCreationEvent(
  event: AnalyticsEvent,
): event is PortfolioCreationEvent {
  return event.type === "portfolio_creation";
}

export function isPortfolioUpdateEvent(
  event: AnalyticsEvent,
): event is PortfolioUpdateEvent {
  return event.type === "portfolio_update";
}

export function isAssetAddedEvent(
  event: AnalyticsEvent,
): event is AssetAddedEvent {
  return event.type === "asset_added";
}

export function isAssetRemovedEvent(
  event: AnalyticsEvent,
): event is AssetRemovedEvent {
  return event.type === "asset_removed";
}

export function isPortfolioValueEvent(
  event: AnalyticsEvent,
): event is PortfolioValueEvent {
  return event.type === "portfolio_value";
}

export function isRebalancingEvent(
  event: AnalyticsEvent,
): event is RebalancingEvent {
  return event.type === "rebalancing";
}

/**
 * Main PortfolioAggregator class for computing portfolio analytics metrics
 * Provides methods to aggregate and analyze portfolio data across multiple projects
 *
 * Capabilities:
 * - Compute portfolio summary statistics (value, returns, assets)
 * - Compute asset allocation metrics by type
 * - Compute rebalancing statistics (frequency, triggers, strategies)
 * - Generate time series data for portfolio values
 * - Filter and aggregate events by portfolio, date range, user
 * - Compare metrics across multiple portfolios
 */
export class PortfolioAggregator {
  private events: AnalyticsEvent[];

  /**
   * Creates a new PortfolioAggregator instance
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
   * Get all portfolio creation events
   */
  getPortfolioCreationEvents(): PortfolioCreationEvent[] {
    return this.events.filter(isPortfolioCreationEvent);
  }

  /**
   * Get all portfolio update events
   */
  getPortfolioUpdateEvents(): PortfolioUpdateEvent[] {
    return this.events.filter(isPortfolioUpdateEvent);
  }

  /**
   * Get all asset added events
   */
  getAssetAddedEvents(): AssetAddedEvent[] {
    return this.events.filter(isAssetAddedEvent);
  }

  /**
   * Get all asset removed events
   */
  getAssetRemovedEvents(): AssetRemovedEvent[] {
    return this.events.filter(isAssetRemovedEvent);
  }

  /**
   * Get all portfolio value events
   */
  getPortfolioValueEvents(): PortfolioValueEvent[] {
    return this.events.filter(isPortfolioValueEvent);
  }

  /**
   * Get all rebalancing events
   */
  getRebalancingEvents(): RebalancingEvent[] {
    return this.events.filter(isRebalancingEvent);
  }

  /**
   * Filter events by portfolio ID
   * @param portfolioId - Portfolio ID to filter by
   */
  filterByPortfolio(portfolioId: string): AnalyticsEvent[] {
    return this.events.filter((event) => {
      return (
        (event.type === "portfolio_creation" && event.portfolio_id === portfolioId) ||
        (event.type === "portfolio_update" && event.portfolio_id === portfolioId) ||
        (event.type === "asset_added" && event.portfolio_id === portfolioId) ||
        (event.type === "asset_removed" && event.portfolio_id === portfolioId) ||
        (event.type === "portfolio_value" && event.portfolio_id === portfolioId) ||
        (event.type === "rebalancing" && event.portfolio_id === portfolioId)
      );
    });
  }

  /**
   * Filter events by user ID
   * @param userId - User ID to filter by
   */
  filterByUser(userId: string): AnalyticsEvent[] {
    return this.events.filter((event) => {
      const hasUserId =
        event.type === "portfolio_creation" ||
        event.type === "portfolio_update" ||
        event.type === "asset_added" ||
        event.type === "asset_removed" ||
        event.type === "rebalancing";
      return hasUserId && (event as any).user_id === userId;
    });
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
   * Compute aggregated portfolio metrics
   * Returns summary metrics, asset allocation, and rebalancing statistics
   * @param portfolioIds - Optional array of portfolio IDs to include
   */
  aggregate(portfolioIds?: string[]): PortfolioAggregationResult {
    // Apply portfolio filtering
    let portfolioEvents = this.events;

    if (portfolioIds && portfolioIds.length > 0) {
      const portfolioSet = new Set(portfolioIds);
      portfolioEvents = this.events.filter((event) => {
        return (
          (event.type === "portfolio_creation" && portfolioSet.has(event.portfolio_id)) ||
          (event.type === "portfolio_update" && portfolioSet.has(event.portfolio_id)) ||
          (event.type === "asset_added" && portfolioSet.has(event.portfolio_id)) ||
          (event.type === "asset_removed" && portfolioSet.has(event.portfolio_id)) ||
          (event.type === "portfolio_value" && portfolioSet.has(event.portfolio_id)) ||
          (event.type === "rebalancing" && portfolioSet.has(event.portfolio_id))
        );
      });
    }

    // Initialize result
    const result = createPortfolioAggregationResult();

    // Get portfolio events
    const creationEvents = portfolioEvents.filter(isPortfolioCreationEvent);
    const assetAddedEvents = portfolioEvents.filter(isAssetAddedEvent);
    const assetRemovedEvents = portfolioEvents.filter(isAssetRemovedEvent);
    const portfolioValueEvents = portfolioEvents.filter(isPortfolioValueEvent);
    const rebalancingEvents = portfolioEvents.filter(isRebalancingEvent);

    // Compute portfolio summary metrics
    const portfolioMetrics = this.computePortfolioSummaryMetrics(
      creationEvents,
      portfolioValueEvents,
      assetAddedEvents,
      assetRemovedEvents,
    );

    for (const [portfolioId, metrics] of Object.entries(portfolioMetrics)) {
      result.portfolio_metrics[portfolioId] = metrics;
      if (metrics.current_value !== undefined) {
        result.total_value += metrics.current_value;
      }
    }

    result.total_portfolios = Object.keys(portfolioMetrics).length;

    // Compute total assets (sum of all assets in all portfolios)
    result.total_assets = assetAddedEvents.length - assetRemovedEvents.length;

    // Compute asset allocation metrics
    const assetAllocation = this.computeAssetAllocationMetrics(
      assetAddedEvents,
      assetRemovedEvents,
      portfolioValueEvents,
    );

    for (const [assetType, metrics] of Object.entries(assetAllocation)) {
      result.asset_allocation[assetType] = metrics;
    }

    // Compute rebalancing metrics
    const rebalancingMetrics = this.computeRebalancingStatistics(rebalancingEvents);

    for (const [portfolioId, metrics] of Object.entries(rebalancingMetrics)) {
      result.rebalancing_metrics[portfolioId] = metrics;
    }

    // Get top portfolios by current value
    result.top_portfolios = Object.entries(result.portfolio_metrics)
      .filter(([, metrics]) => metrics.current_value !== undefined)
      .sort(([, a], [, b]) => (b.current_value ?? 0) - (a.current_value ?? 0))
      .map(([portfolioId]) => portfolioId);

    // Get top asset types by allocation
    result.top_asset_types = Object.entries(result.asset_allocation)
      .sort(([, a], [, b]) => b.allocation_percentage - a.allocation_percentage)
      .map(([assetType]) => assetType);

    return result;
  }

  /**
   * Compute portfolio summary metrics
   * For each portfolio, calculates value, returns, asset count, and timestamps
   * @param creationEvents - Portfolio creation events
   * @param valueEvents - Portfolio value events
   * @param assetAddedEvents - Asset added events
   * @param assetRemovedEvents - Asset removed events
   */
  computePortfolioSummaryMetrics(
    creationEvents: PortfolioCreationEvent[],
    valueEvents: PortfolioValueEvent[],
    assetAddedEvents: AssetAddedEvent[],
    assetRemovedEvents: AssetRemovedEvent[],
  ): Record<string, PortfolioSummaryMetrics> {
    const portfolioMetrics: Record<string, PortfolioSummaryMetrics> = {};

    // Initialize from creation events
    for (const event of creationEvents) {
      if (!portfolioMetrics[event.portfolio_id]) {
        portfolioMetrics[event.portfolio_id] = createPortfolioSummaryMetrics(
          event.portfolio_id,
          event.portfolio_name,
        );
      }
      const metrics = portfolioMetrics[event.portfolio_id];
      if (metrics) {
        metrics.created_at = event.timestamp;
        metrics.initial_value = event.initial_value;
        metrics.currency = event.currency;
        if (event.strategy) {
          metrics.strategy = event.strategy;
        }
      }
    }

    // Calculate asset count for each portfolio
    const assetCounts: Record<string, number> = {};
    for (const event of assetAddedEvents) {
      assetCounts[event.portfolio_id] = (assetCounts[event.portfolio_id] ?? 0) + 1;
    }
    for (const event of assetRemovedEvents) {
      assetCounts[event.portfolio_id] = (assetCounts[event.portfolio_id] ?? 0) - 1;
    }

    // Update portfolio metrics from value events
    for (const event of valueEvents) {
      if (!portfolioMetrics[event.portfolio_id]) {
        portfolioMetrics[event.portfolio_id] = createPortfolioSummaryMetrics(
          event.portfolio_id,
          event.portfolio_name,
        );
      }

      const metrics = portfolioMetrics[event.portfolio_id];
      if (metrics) {
        metrics.current_value = event.total_value;
        metrics.currency = event.currency;
        metrics.asset_count = event.asset_count;

        if (event.daily_return !== undefined) {
          metrics.daily_return = event.daily_return;
        }
        if (event.total_return !== undefined) {
          metrics.total_return = event.total_return;
        }

        metrics.last_updated = event.timestamp;
      }
    }

    // Apply asset counts to portfolios that don't have value events
    for (const [portfolioId, count] of Object.entries(assetCounts)) {
      if (portfolioMetrics[portfolioId]) {
        if (portfolioMetrics[portfolioId].asset_count === 0) {
          portfolioMetrics[portfolioId].asset_count = count;
        }
      }
    }

    return portfolioMetrics;
  }

  /**
   * Compute asset allocation metrics by asset type
   * @param assetAddedEvents - Asset added events
   * @param assetRemovedEvents - Asset removed events
   * @param valueEvents - Portfolio value events for total value reference
   */
  computeAssetAllocationMetrics(
    assetAddedEvents: AssetAddedEvent[],
    assetRemovedEvents: AssetRemovedEvent[],
    valueEvents: PortfolioValueEvent[],
  ): Record<string, AssetAllocationMetrics> {
    const assetMetrics: Record<string, AssetAllocationMetrics> = {};
    const assetValues: Record<string, number> = {};
    const assetCounts: Record<string, number> = {};
    const assetsByType: Record<string, Record<string, number>> = {};

    // Calculate asset values and counts by type
    for (const event of assetAddedEvents) {
      assetValues[event.asset_type] = (assetValues[event.asset_type] ?? 0) + event.total_value;
      assetCounts[event.asset_type] = (assetCounts[event.asset_type] ?? 0) + 1;

      if (!assetsByType[event.asset_type]) {
        assetsByType[event.asset_type] = {};
      }
      const typeAssets = assetsByType[event.asset_type];
      if (typeAssets) {
        typeAssets[event.asset_name] =
          (typeAssets[event.asset_name] ?? 0) + event.total_value;
      }
    }

    // Subtract removed assets
    for (const event of assetRemovedEvents) {
      assetValues[event.asset_type] = (assetValues[event.asset_type] ?? 0) - event.total_value;
      assetCounts[event.asset_type] = (assetCounts[event.asset_type] ?? 0) - 1;

      if (assetsByType[event.asset_type]) {
        const typeAssets = assetsByType[event.asset_type];
        if (typeAssets) {
          typeAssets[event.asset_name] =
            (typeAssets[event.asset_name] ?? 0) - event.total_value;
        }
      }
    }

    // Get total portfolio value for allocation percentage calculation
    const totalPortfolioValue = valueEvents.reduce((sum, event) => sum + event.total_value, 0);

    // Create metrics for each asset type
    for (const [assetType, value] of Object.entries(assetValues)) {
      if (value > 0) {
        assetMetrics[assetType] = createAssetAllocationMetrics(
          assetType as "stock" | "bond" | "etf" | "crypto" | "commodity" | "cash" | "other",
        );
        assetMetrics[assetType].total_value = value;
        assetMetrics[assetType].asset_count = assetCounts[assetType] ?? 0;

        if (totalPortfolioValue > 0) {
          assetMetrics[assetType].allocation_percentage = value / totalPortfolioValue;
        }

        // Get top assets for this type
        const assetsForType = assetsByType[assetType] ?? {};
        assetMetrics[assetType].top_assets = Object.entries(assetsForType)
          .filter(([, assetValue]) => assetValue > 0)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([assetName]) => assetName);
      }
    }

    return assetMetrics;
  }

  /**
   * Compute rebalancing statistics for portfolios
   * @param rebalancingEvents - Rebalancing events
   */
  computeRebalancingStatistics(
    rebalancingEvents: RebalancingEvent[],
  ): Record<string, RebalancingStatistics> {
    const rebalancingMetrics: Record<string, RebalancingStatistics> = {};

    for (const event of rebalancingEvents) {
      if (!rebalancingMetrics[event.portfolio_id]) {
        rebalancingMetrics[event.portfolio_id] = createRebalancingStatistics(
          event.portfolio_id,
          event.portfolio_name,
        );
      }

      const metrics = rebalancingMetrics[event.portfolio_id];
      if (metrics) {
        metrics.total_rebalances += 1;
        metrics.total_trades_executed += event.trades_executed;

        // Track by trigger reason
        metrics.by_trigger_reason[event.trigger_reason] =
          (metrics.by_trigger_reason[event.trigger_reason] ?? 0) + 1;

        // Track by strategy
        metrics.by_strategy[event.strategy] = (metrics.by_strategy[event.strategy] ?? 0) + 1;

        // Update last rebalanced timestamp
        if (!metrics.last_rebalanced || event.timestamp > metrics.last_rebalanced) {
          metrics.last_rebalanced = event.timestamp;
        }
      }
    }

    return rebalancingMetrics;
  }

  /**
   * Generate time series data for portfolio values
   * Groups events by time interval (hour, day, week, month)
   * @param interval - Time interval for grouping
   * @param startDate - Start date for time series
   * @param endDate - End date for time series
   * @param portfolioIds - Optional array of portfolio IDs to include
   */
  generateTimeSeries(
    interval: "hour" | "day" | "week" | "month",
    startDate: Date,
    endDate: Date,
    portfolioIds?: string[],
  ): {
    series: Record<string, TimeSeriesDataPoint[]>;
    start_date: string;
    end_date: string;
    interval: "hour" | "day" | "week" | "month";
  } {
    let valueEvents = this.getPortfolioValueEvents();

    // Filter by portfolio IDs if specified
    if (portfolioIds && portfolioIds.length > 0) {
      const portfolioSet = new Set(portfolioIds);
      valueEvents = valueEvents.filter((event) => portfolioSet.has(event.portfolio_id));
    }

    // Filter by date range
    const filteredEvents = valueEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
    });

    // Group events by time interval and portfolio
    const timeSeriesByPortfolio: Record<string, Record<string, number>> = {};

    for (const event of filteredEvents) {
      const eventDate = new Date(event.timestamp);
      const timeKey = this.getTimeKey(eventDate, interval);

      if (!timeSeriesByPortfolio[event.portfolio_id]) {
        timeSeriesByPortfolio[event.portfolio_id] = {};
      }
      const portfolioSeries = timeSeriesByPortfolio[event.portfolio_id];
      if (portfolioSeries) {
        portfolioSeries[timeKey] = event.total_value;
      }
    }

    // Also aggregate across all portfolios
    const allPortfoliosTimeSeries: Record<string, number> = {};
    for (const portfolioSeries of Object.values(timeSeriesByPortfolio)) {
      for (const [timeKey, value] of Object.entries(portfolioSeries)) {
        allPortfoliosTimeSeries[timeKey] = (allPortfoliosTimeSeries[timeKey] ?? 0) + value;
      }
    }

    // Convert to time series data points
    const series: Record<string, TimeSeriesDataPoint[]> = {};

    // Add all portfolios combined series
    series.all = Object.entries(allPortfoliosTimeSeries)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, value]) => ({ timestamp, value }));

    // Add individual portfolio series
    for (const [portfolioId, portfolioSeries] of Object.entries(timeSeriesByPortfolio)) {
      series[portfolioId] = Object.entries(portfolioSeries)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([timestamp, value]) => ({ timestamp, value }));
    }

    return {
      series,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      interval,
    };
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
   * Compare metrics across multiple portfolios
   * @param portfolioIds - Array of portfolio IDs to compare
   * @param comparisonType - Type of comparison (value, return, volatility, asset_allocation)
   */
  comparePortfolios(
    portfolioIds: string[],
    comparisonType: "value" | "return" | "volatility" | "asset_allocation",
  ): CrossPortfolioComparison {
    const result = createCrossPortfolioComparison(portfolioIds, comparisonType);

    const portfolioMetrics = this.aggregate(portfolioIds).portfolio_metrics;
    const values: number[] = [];

    for (const portfolioId of portfolioIds) {
      const metrics = portfolioMetrics[portfolioId];
      if (!metrics) continue;

      let value: number | undefined;

      switch (comparisonType) {
        case "value":
          value = metrics.current_value;
          break;
        case "return":
          value = metrics.total_return;
          break;
        case "volatility":
          // This would require more sophisticated calculation from time series data
          value = undefined;
          break;
        case "asset_allocation":
          // This would require returning allocation percentages by type
          value = undefined;
          break;
      }

      if (value !== undefined) {
        result.metrics[portfolioId] = value;
        values.push(value);
      }
    }

    // Calculate best, worst, and average
    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      result.worst_performing = Object.entries(result.metrics).find(
        ([_, v]) => v === sorted[0],
      )?.[0];
      result.best_performing = Object.entries(result.metrics).find(
        ([_, v]) => v === sorted[sorted.length - 1],
      )?.[0];

      const sum = values.reduce((a, b) => a + b, 0);
      result.average = sum / values.length;
    }

    return result;
  }

  /**
   * Get summary statistics for all portfolio events
   */
  getSummary(): {
    total_portfolios: number;
    total_assets_added: number;
    total_assets_removed: number;
    total_value: number;
    total_rebalances: number;
    unique_users: number;
    unique_strategies: number;
  } {
    const creationEvents = this.getPortfolioCreationEvents();
    const assetAddedEvents = this.getAssetAddedEvents();
    const assetRemovedEvents = this.getAssetRemovedEvents();
    const portfolioValueEvents = this.getPortfolioValueEvents();
    const rebalancingEvents = this.getRebalancingEvents();

    const uniqueUsers = new Set(
      [
        ...creationEvents.map((e) => e.user_id),
        ...assetAddedEvents.map((e) => e.user_id),
        ...assetRemovedEvents.map((e) => e.user_id),
        ...rebalancingEvents.map((e) => e.user_id),
      ].filter((u): u is string => u !== undefined),
    ).size;

    const uniqueStrategies = new Set(
      [
        ...creationEvents.map((e) => e.strategy),
        ...rebalancingEvents.map((e) => e.strategy),
      ].filter((s): s is string => s !== undefined),
    ).size;

    return {
      total_portfolios: creationEvents.length,
      total_assets_added: assetAddedEvents.length,
      total_assets_removed: assetRemovedEvents.length,
      total_value: portfolioValueEvents.reduce((sum, e) => sum + e.total_value, 0),
      total_rebalances: rebalancingEvents.length,
      unique_users: uniqueUsers,
      unique_strategies: uniqueStrategies,
    };
  }

  /**
   * Get top N portfolios by current value
   * @param limit - Maximum number of portfolios to return
   */
  getTopPortfoliosByValue(limit: number = 10): Array<{
    portfolio_id: string;
    portfolio_name: string;
    current_value: number;
  }> {
    const portfolioMetrics = this.aggregate().portfolio_metrics;

    return Object.entries(portfolioMetrics)
      .filter(([, metrics]) => metrics.current_value !== undefined)
      .map(([portfolioId, metrics]) => ({
        portfolio_id: portfolioId,
        portfolio_name: metrics.portfolio_name,
        current_value: metrics.current_value ?? 0,
      }))
      .sort((a, b) => b.current_value - a.current_value)
      .slice(0, limit);
  }

  /**
   * Get top N assets by total value
   * @param limit - Maximum number of assets to return
   */
  getTopAssets(limit: number = 10): Array<{
    asset_name: string;
    asset_type: string;
    total_value: number;
  }> {
    const assetAddedEvents = this.getAssetAddedEvents();
    const assetRemovedEvents = this.getAssetRemovedEvents();

    const assetValues: Record<string, { asset_type: string; value: number }> = {};

    for (const event of assetAddedEvents) {
      if (!assetValues[event.asset_name]) {
        assetValues[event.asset_name] = {
          asset_type: event.asset_type,
          value: 0,
        };
      }
      const assetValue = assetValues[event.asset_name];
      if (assetValue) {
        assetValue.value += event.total_value;
      }
    }

    for (const event of assetRemovedEvents) {
      if (assetValues[event.asset_name]) {
        const assetValue = assetValues[event.asset_name];
        if (assetValue) {
          assetValue.value -= event.total_value;
        }
      }
    }

    return Object.entries(assetValues)
      .filter(([, data]) => data.value > 0)
      .map(([asset_name, data]) => ({
        asset_name,
        asset_type: data.asset_type,
        total_value: data.value,
      }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, limit);
  }
}

/**
 * Convenience function to create a portfolio aggregator and compute metrics
 * @param events - Array of analytics events
 * @param portfolioIds - Optional array of portfolio IDs to include
 */
export function aggregatePortfolio(
  events: AnalyticsEvent[],
  portfolioIds?: string[],
): PortfolioAggregationResult {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.aggregate(portfolioIds);
}

/**
 * Convenience function to compute portfolio summary metrics
 * @param events - Array of analytics events
 */
export function computePortfolioSummaryMetrics(
  events: AnalyticsEvent[],
): Record<string, PortfolioSummaryMetrics> {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.computePortfolioSummaryMetrics(
    aggregator.getPortfolioCreationEvents(),
    aggregator.getPortfolioValueEvents(),
    aggregator.getAssetAddedEvents(),
    aggregator.getAssetRemovedEvents(),
  );
}

/**
 * Convenience function to compute asset allocation metrics
 * @param events - Array of analytics events
 */
export function computeAssetAllocation(
  events: AnalyticsEvent[],
): Record<string, AssetAllocationMetrics> {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.computeAssetAllocationMetrics(
    aggregator.getAssetAddedEvents(),
    aggregator.getAssetRemovedEvents(),
    aggregator.getPortfolioValueEvents(),
  );
}

/**
 * Convenience function to compute rebalancing statistics
 * @param events - Array of analytics events
 */
export function computeRebalancingStatistics(
  events: AnalyticsEvent[],
): Record<string, RebalancingStatistics> {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.computeRebalancingStatistics(aggregator.getRebalancingEvents());
}
