// src/analytics/portfolio-aggregator.ts
import { z } from "zod";
var PortfolioSummaryMetricsSchema = z.object({
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
  strategy: z.string().optional()
});
var AssetAllocationMetricsSchema = z.object({
  asset_type: z.enum(["stock", "bond", "etf", "crypto", "commodity", "cash", "other"]),
  total_value: z.number().nonnegative(),
  allocation_percentage: z.number().min(0).max(1),
  asset_count: z.number().int().nonnegative(),
  top_assets: z.array(z.string())
});
var RebalancingStatisticsSchema = z.object({
  portfolio_id: z.string(),
  portfolio_name: z.string(),
  total_rebalances: z.number().int().nonnegative(),
  by_trigger_reason: z.record(z.string(), z.number().int().nonnegative()),
  by_strategy: z.record(z.string(), z.number().int().nonnegative()),
  total_trades_executed: z.number().int().nonnegative(),
  last_rebalanced: z.string().datetime().optional()
});
var PortfolioAggregationResultSchema = z.object({
  total_portfolios: z.number().int().nonnegative(),
  total_assets: z.number().int().nonnegative(),
  total_value: z.number().nonnegative(),
  portfolio_metrics: z.record(z.string(), PortfolioSummaryMetricsSchema),
  asset_allocation: z.record(z.string(), AssetAllocationMetricsSchema),
  rebalancing_metrics: z.record(z.string(), RebalancingStatisticsSchema),
  top_portfolios: z.array(z.string()),
  top_asset_types: z.array(z.string())
});
var CrossPortfolioComparisonSchema = z.object({
  portfolio_ids: z.array(z.string()),
  comparison_type: z.enum(["value", "return", "volatility", "asset_allocation"]),
  metrics: z.record(z.string(), z.number()),
  best_performing: z.string().optional(),
  worst_performing: z.string().optional(),
  average: z.number().optional()
});
function createPortfolioAggregationResult() {
  return {
    total_portfolios: 0,
    total_assets: 0,
    total_value: 0,
    portfolio_metrics: {},
    asset_allocation: {},
    rebalancing_metrics: {},
    top_portfolios: [],
    top_asset_types: []
  };
}
function createPortfolioSummaryMetrics(portfolioId, portfolioName) {
  return {
    portfolio_id: portfolioId,
    portfolio_name: portfolioName,
    created_at: void 0,
    current_value: void 0,
    initial_value: void 0,
    total_return: void 0,
    daily_return: void 0,
    asset_count: 0,
    last_updated: void 0,
    currency: "USD",
    strategy: void 0
  };
}
function createAssetAllocationMetrics(assetType) {
  return {
    asset_type: assetType,
    total_value: 0,
    allocation_percentage: 0,
    asset_count: 0,
    top_assets: []
  };
}
function createRebalancingStatistics(portfolioId, portfolioName) {
  return {
    portfolio_id: portfolioId,
    portfolio_name: portfolioName,
    total_rebalances: 0,
    by_trigger_reason: {},
    by_strategy: {},
    total_trades_executed: 0,
    last_rebalanced: void 0
  };
}
function createCrossPortfolioComparison(portfolioIds, comparisonType) {
  return {
    portfolio_ids: portfolioIds,
    comparison_type: comparisonType,
    metrics: {},
    best_performing: void 0,
    worst_performing: void 0,
    average: void 0
  };
}
function isPortfolioCreationEvent(event) {
  return event.type === "portfolio_creation";
}
function isPortfolioUpdateEvent(event) {
  return event.type === "portfolio_update";
}
function isAssetAddedEvent(event) {
  return event.type === "asset_added";
}
function isAssetRemovedEvent(event) {
  return event.type === "asset_removed";
}
function isPortfolioValueEvent(event) {
  return event.type === "portfolio_value";
}
function isRebalancingEvent(event) {
  return event.type === "rebalancing";
}
var PortfolioAggregator = class {
  events;
  /**
   * Creates a new PortfolioAggregator instance
   * @param events - Array of analytics events to aggregate
   */
  constructor(events = []) {
    this.events = [...events];
  }
  /**
   * Update the events to aggregate
   * @param events - New array of analytics events
   */
  updateEvents(events) {
    this.events = [...events];
  }
  /**
   * Get all portfolio creation events
   */
  getPortfolioCreationEvents() {
    return this.events.filter(isPortfolioCreationEvent);
  }
  /**
   * Get all portfolio update events
   */
  getPortfolioUpdateEvents() {
    return this.events.filter(isPortfolioUpdateEvent);
  }
  /**
   * Get all asset added events
   */
  getAssetAddedEvents() {
    return this.events.filter(isAssetAddedEvent);
  }
  /**
   * Get all asset removed events
   */
  getAssetRemovedEvents() {
    return this.events.filter(isAssetRemovedEvent);
  }
  /**
   * Get all portfolio value events
   */
  getPortfolioValueEvents() {
    return this.events.filter(isPortfolioValueEvent);
  }
  /**
   * Get all rebalancing events
   */
  getRebalancingEvents() {
    return this.events.filter(isRebalancingEvent);
  }
  /**
   * Filter events by portfolio ID
   * @param portfolioId - Portfolio ID to filter by
   */
  filterByPortfolio(portfolioId) {
    return this.events.filter((event) => {
      return event.type === "portfolio_creation" && event.portfolio_id === portfolioId || event.type === "portfolio_update" && event.portfolio_id === portfolioId || event.type === "asset_added" && event.portfolio_id === portfolioId || event.type === "asset_removed" && event.portfolio_id === portfolioId || event.type === "portfolio_value" && event.portfolio_id === portfolioId || event.type === "rebalancing" && event.portfolio_id === portfolioId;
    });
  }
  /**
   * Filter events by user ID
   * @param userId - User ID to filter by
   */
  filterByUser(userId) {
    return this.events.filter((event) => {
      const eventsWithUser = [
        "portfolio_creation",
        "portfolio_update",
        "asset_added",
        "asset_removed",
        "rebalancing"
      ].includes(event.type) ? event : { ...event, user_id: void 0 };
      return eventsWithUser.user_id === userId;
    });
  }
  /**
   * Filter events by date range
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   */
  filterByDateRange(startDate, endDate) {
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
  aggregate(portfolioIds) {
    let portfolioEvents = this.events;
    if (portfolioIds && portfolioIds.length > 0) {
      const portfolioSet = new Set(portfolioIds);
      portfolioEvents = this.events.filter((event) => {
        return event.type === "portfolio_creation" && portfolioSet.has(event.portfolio_id) || event.type === "portfolio_update" && portfolioSet.has(event.portfolio_id) || event.type === "asset_added" && portfolioSet.has(event.portfolio_id) || event.type === "asset_removed" && portfolioSet.has(event.portfolio_id) || event.type === "portfolio_value" && portfolioSet.has(event.portfolio_id) || event.type === "rebalancing" && portfolioSet.has(event.portfolio_id);
      });
    }
    const result = createPortfolioAggregationResult();
    const creationEvents = portfolioEvents.filter(isPortfolioCreationEvent);
    const assetAddedEvents = portfolioEvents.filter(isAssetAddedEvent);
    const assetRemovedEvents = portfolioEvents.filter(isAssetRemovedEvent);
    const portfolioValueEvents = portfolioEvents.filter(isPortfolioValueEvent);
    const rebalancingEvents = portfolioEvents.filter(isRebalancingEvent);
    const portfolioMetrics = this.computePortfolioSummaryMetrics(
      creationEvents,
      portfolioValueEvents,
      assetAddedEvents,
      assetRemovedEvents
    );
    for (const [portfolioId, metrics] of Object.entries(portfolioMetrics)) {
      result.portfolio_metrics[portfolioId] = metrics;
      if (metrics.current_value !== void 0) {
        result.total_value += metrics.current_value;
      }
    }
    result.total_portfolios = Object.keys(portfolioMetrics).length;
    result.total_assets = assetAddedEvents.length - assetRemovedEvents.length;
    const assetAllocation = this.computeAssetAllocationMetrics(
      assetAddedEvents,
      assetRemovedEvents,
      portfolioValueEvents
    );
    for (const [assetType, metrics] of Object.entries(assetAllocation)) {
      result.asset_allocation[assetType] = metrics;
    }
    const rebalancingMetrics = this.computeRebalancingStatistics(rebalancingEvents);
    for (const [portfolioId, metrics] of Object.entries(rebalancingMetrics)) {
      result.rebalancing_metrics[portfolioId] = metrics;
    }
    result.top_portfolios = Object.entries(result.portfolio_metrics).filter(([, metrics]) => metrics.current_value !== void 0).sort(([, a], [, b]) => (b.current_value ?? 0) - (a.current_value ?? 0)).map(([portfolioId]) => portfolioId);
    result.top_asset_types = Object.entries(result.asset_allocation).sort(([, a], [, b]) => b.allocation_percentage - a.allocation_percentage).map(([assetType]) => assetType);
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
  computePortfolioSummaryMetrics(creationEvents, valueEvents, assetAddedEvents, assetRemovedEvents) {
    const portfolioMetrics = {};
    for (const event of creationEvents) {
      if (!portfolioMetrics[event.portfolio_id]) {
        portfolioMetrics[event.portfolio_id] = createPortfolioSummaryMetrics(
          event.portfolio_id,
          event.portfolio_name
        );
      }
      portfolioMetrics[event.portfolio_id].created_at = event.timestamp;
      portfolioMetrics[event.portfolio_id].initial_value = event.initial_value;
      portfolioMetrics[event.portfolio_id].currency = event.currency;
      if (event.strategy) {
        portfolioMetrics[event.portfolio_id].strategy = event.strategy;
      }
    }
    const assetCounts = {};
    for (const event of assetAddedEvents) {
      assetCounts[event.portfolio_id] = (assetCounts[event.portfolio_id] ?? 0) + 1;
    }
    for (const event of assetRemovedEvents) {
      assetCounts[event.portfolio_id] = (assetCounts[event.portfolio_id] ?? 0) - 1;
    }
    for (const event of valueEvents) {
      if (!portfolioMetrics[event.portfolio_id]) {
        portfolioMetrics[event.portfolio_id] = createPortfolioSummaryMetrics(
          event.portfolio_id,
          event.portfolio_name
        );
      }
      portfolioMetrics[event.portfolio_id].current_value = event.total_value;
      portfolioMetrics[event.portfolio_id].currency = event.currency;
      portfolioMetrics[event.portfolio_id].asset_count = event.asset_count;
      if (event.daily_return !== void 0) {
        portfolioMetrics[event.portfolio_id].daily_return = event.daily_return;
      }
      if (event.total_return !== void 0) {
        portfolioMetrics[event.portfolio_id].total_return = event.total_return;
      }
      portfolioMetrics[event.portfolio_id].last_updated = event.timestamp;
    }
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
  computeAssetAllocationMetrics(assetAddedEvents, assetRemovedEvents, valueEvents) {
    const assetMetrics = {};
    const assetValues = {};
    const assetCounts = {};
    const assetsByType = {};
    for (const event of assetAddedEvents) {
      assetValues[event.asset_type] = (assetValues[event.asset_type] ?? 0) + event.total_value;
      assetCounts[event.asset_type] = (assetCounts[event.asset_type] ?? 0) + 1;
      if (!assetsByType[event.asset_type]) {
        assetsByType[event.asset_type] = {};
      }
      assetsByType[event.asset_type][event.asset_name] = (assetsByType[event.asset_type][event.asset_name] ?? 0) + event.total_value;
    }
    for (const event of assetRemovedEvents) {
      assetValues[event.asset_type] = (assetValues[event.asset_type] ?? 0) - event.total_value;
      assetCounts[event.asset_type] = (assetCounts[event.asset_type] ?? 0) - 1;
      if (assetsByType[event.asset_type]) {
        assetsByType[event.asset_type][event.asset_name] = (assetsByType[event.asset_type][event.asset_name] ?? 0) - event.total_value;
      }
    }
    const totalPortfolioValue = valueEvents.reduce((sum, event) => sum + event.total_value, 0);
    for (const [assetType, value] of Object.entries(assetValues)) {
      if (value > 0) {
        assetMetrics[assetType] = createAssetAllocationMetrics(
          assetType
        );
        assetMetrics[assetType].total_value = value;
        assetMetrics[assetType].asset_count = assetCounts[assetType] ?? 0;
        if (totalPortfolioValue > 0) {
          assetMetrics[assetType].allocation_percentage = value / totalPortfolioValue;
        }
        const assetsForType = assetsByType[assetType] ?? {};
        assetMetrics[assetType].top_assets = Object.entries(assetsForType).filter(([, assetValue]) => assetValue > 0).sort(([, a], [, b]) => b - a).slice(0, 10).map(([assetName]) => assetName);
      }
    }
    return assetMetrics;
  }
  /**
   * Compute rebalancing statistics for portfolios
   * @param rebalancingEvents - Rebalancing events
   */
  computeRebalancingStatistics(rebalancingEvents) {
    const rebalancingMetrics = {};
    for (const event of rebalancingEvents) {
      if (!rebalancingMetrics[event.portfolio_id]) {
        rebalancingMetrics[event.portfolio_id] = createRebalancingStatistics(
          event.portfolio_id,
          event.portfolio_name
        );
      }
      const metrics = rebalancingMetrics[event.portfolio_id];
      metrics.total_rebalances += 1;
      metrics.total_trades_executed += event.trades_executed;
      metrics.by_trigger_reason[event.trigger_reason] = (metrics.by_trigger_reason[event.trigger_reason] ?? 0) + 1;
      metrics.by_strategy[event.strategy] = (metrics.by_strategy[event.strategy] ?? 0) + 1;
      if (!metrics.last_rebalanced || event.timestamp > metrics.last_rebalanced) {
        metrics.last_rebalanced = event.timestamp;
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
  generateTimeSeries(interval, startDate, endDate, portfolioIds) {
    let valueEvents = this.getPortfolioValueEvents();
    if (portfolioIds && portfolioIds.length > 0) {
      const portfolioSet = new Set(portfolioIds);
      valueEvents = valueEvents.filter((event) => portfolioSet.has(event.portfolio_id));
    }
    const filteredEvents = valueEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
    });
    const timeSeriesByPortfolio = {};
    for (const event of filteredEvents) {
      const eventDate = new Date(event.timestamp);
      const timeKey = this.getTimeKey(eventDate, interval);
      if (!timeSeriesByPortfolio[event.portfolio_id]) {
        timeSeriesByPortfolio[event.portfolio_id] = {};
      }
      timeSeriesByPortfolio[event.portfolio_id][timeKey] = event.total_value;
    }
    const allPortfoliosTimeSeries = {};
    for (const portfolioSeries of Object.values(timeSeriesByPortfolio)) {
      for (const [timeKey, value] of Object.entries(portfolioSeries)) {
        allPortfoliosTimeSeries[timeKey] = (allPortfoliosTimeSeries[timeKey] ?? 0) + value;
      }
    }
    const series = {};
    series.all = Object.entries(allPortfoliosTimeSeries).sort(([a], [b]) => a.localeCompare(b)).map(([timestamp, value]) => ({ timestamp, value }));
    for (const [portfolioId, portfolioSeries] of Object.entries(timeSeriesByPortfolio)) {
      series[portfolioId] = Object.entries(portfolioSeries).sort(([a], [b]) => a.localeCompare(b)).map(([timestamp, value]) => ({ timestamp, value }));
    }
    return {
      series,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      interval
    };
  }
  /**
   * Get time key for grouping events
   * @param date - Date to generate key for
   * @param interval - Time interval
   */
  getTimeKey(date, interval) {
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
  getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  }
  /**
   * Compare metrics across multiple portfolios
   * @param portfolioIds - Array of portfolio IDs to compare
   * @param comparisonType - Type of comparison (value, return, volatility, asset_allocation)
   */
  comparePortfolios(portfolioIds, comparisonType) {
    const result = createCrossPortfolioComparison(portfolioIds, comparisonType);
    const portfolioMetrics = this.aggregate(portfolioIds).portfolio_metrics;
    const values = [];
    for (const portfolioId of portfolioIds) {
      const metrics = portfolioMetrics[portfolioId];
      if (!metrics) continue;
      let value;
      switch (comparisonType) {
        case "value":
          value = metrics.current_value;
          break;
        case "return":
          value = metrics.total_return;
          break;
        case "volatility":
          value = void 0;
          break;
        case "asset_allocation":
          value = void 0;
          break;
      }
      if (value !== void 0) {
        result.metrics[portfolioId] = value;
        values.push(value);
      }
    }
    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      result.worst_performing = Object.entries(result.metrics).find(
        ([_, v]) => v === sorted[0]
      )?.[0];
      result.best_performing = Object.entries(result.metrics).find(
        ([_, v]) => v === sorted[sorted.length - 1]
      )?.[0];
      const sum = values.reduce((a, b) => a + b, 0);
      result.average = sum / values.length;
    }
    return result;
  }
  /**
   * Get summary statistics for all portfolio events
   */
  getSummary() {
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
        ...rebalancingEvents.map((e) => e.user_id)
      ].filter((u) => u !== void 0)
    ).size;
    const uniqueStrategies = new Set(
      [
        ...creationEvents.map((e) => e.strategy),
        ...rebalancingEvents.map((e) => e.strategy)
      ].filter((s) => s !== void 0)
    ).size;
    return {
      total_portfolios: creationEvents.length,
      total_assets_added: assetAddedEvents.length,
      total_assets_removed: assetRemovedEvents.length,
      total_value: portfolioValueEvents.reduce((sum, e) => sum + e.total_value, 0),
      total_rebalances: rebalancingEvents.length,
      unique_users: uniqueUsers,
      unique_strategies: uniqueStrategies
    };
  }
  /**
   * Get top N portfolios by current value
   * @param limit - Maximum number of portfolios to return
   */
  getTopPortfoliosByValue(limit = 10) {
    const portfolioMetrics = this.aggregate().portfolio_metrics;
    return Object.entries(portfolioMetrics).filter(([, metrics]) => metrics.current_value !== void 0).map(([portfolioId, metrics]) => ({
      portfolio_id: portfolioId,
      portfolio_name: metrics.portfolio_name,
      current_value: metrics.current_value ?? 0
    })).sort((a, b) => b.current_value - a.current_value).slice(0, limit);
  }
  /**
   * Get top N assets by total value
   * @param limit - Maximum number of assets to return
   */
  getTopAssets(limit = 10) {
    const assetAddedEvents = this.getAssetAddedEvents();
    const assetRemovedEvents = this.getAssetRemovedEvents();
    const assetValues = {};
    for (const event of assetAddedEvents) {
      if (!assetValues[event.asset_name]) {
        assetValues[event.asset_name] = {
          asset_type: event.asset_type,
          value: 0
        };
      }
      assetValues[event.asset_name].value += event.total_value;
    }
    for (const event of assetRemovedEvents) {
      if (assetValues[event.asset_name]) {
        assetValues[event.asset_name].value -= event.total_value;
      }
    }
    return Object.entries(assetValues).filter(([, data]) => data.value > 0).map(([asset_name, data]) => ({
      asset_name,
      asset_type: data.asset_type,
      total_value: data.value
    })).sort((a, b) => b.total_value - a.total_value).slice(0, limit);
  }
};
function aggregatePortfolio(events, portfolioIds) {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.aggregate(portfolioIds);
}
function computePortfolioSummaryMetrics(events) {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.computePortfolioSummaryMetrics(
    aggregator.getPortfolioCreationEvents(),
    aggregator.getPortfolioValueEvents(),
    aggregator.getAssetAddedEvents(),
    aggregator.getAssetRemovedEvents()
  );
}
function computeAssetAllocation(events) {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.computeAssetAllocationMetrics(
    aggregator.getAssetAddedEvents(),
    aggregator.getAssetRemovedEvents(),
    aggregator.getPortfolioValueEvents()
  );
}
function computeRebalancingStatistics(events) {
  const aggregator = new PortfolioAggregator(events);
  return aggregator.computeRebalancingStatistics(aggregator.getRebalancingEvents());
}
export {
  AssetAllocationMetricsSchema,
  CrossPortfolioComparisonSchema,
  PortfolioAggregationResultSchema,
  PortfolioAggregator,
  PortfolioSummaryMetricsSchema,
  RebalancingStatisticsSchema,
  aggregatePortfolio,
  computeAssetAllocation,
  computePortfolioSummaryMetrics,
  computeRebalancingStatistics,
  createAssetAllocationMetrics,
  createCrossPortfolioComparison,
  createPortfolioAggregationResult,
  createPortfolioSummaryMetrics,
  createRebalancingStatistics,
  isAssetAddedEvent,
  isAssetRemovedEvent,
  isPortfolioCreationEvent,
  isPortfolioUpdateEvent,
  isPortfolioValueEvent,
  isRebalancingEvent
};
