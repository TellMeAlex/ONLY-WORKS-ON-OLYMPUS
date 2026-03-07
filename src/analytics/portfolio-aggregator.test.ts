import { test, expect, describe, beforeEach } from "bun:test";
import {
  PortfolioAggregator,
  aggregatePortfolio,
  computePortfolioSummaryMetrics,
  computeAssetAllocation,
  computeRebalancingStatistics,
  createPortfolioAggregationResult,
  createPortfolioSummaryMetrics,
  createAssetAllocationMetrics,
  createRebalancingStatistics,
  createCrossPortfolioComparison,
  isPortfolioCreationEvent,
  isPortfolioUpdateEvent,
  isAssetAddedEvent,
  isAssetRemovedEvent,
  isPortfolioValueEvent,
  isRebalancingEvent,
  type PortfolioAggregationResult,
  type PortfolioSummaryMetrics,
  type AssetAllocationMetrics,
  type RebalancingStatistics,
  type CrossPortfolioComparison,
} from "./portfolio-aggregator.js";
import type { AnalyticsEvent } from "./types.js";

describe("PortfolioAggregator", () => {
  let aggregator: PortfolioAggregator;
  let sampleEvents: AnalyticsEvent[];

  beforeEach(() => {
    aggregator = new PortfolioAggregator();

    // Create sample events for testing
    sampleEvents = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        type: "portfolio_creation",
        portfolio_id: "portfolio1",
        portfolio_name: "Growth Portfolio",
        initial_value: 10000,
        currency: "USD",
        user_id: "user1",
        strategy: "growth",
      },
      {
        timestamp: "2024-01-02T00:00:00Z",
        type: "asset_added",
        portfolio_id: "portfolio1",
        asset_name: "AAPL",
        asset_type: "stock",
        quantity: 10,
        price: 150,
        total_value: 1500,
        user_id: "user1",
      },
      {
        timestamp: "2024-01-03T00:00:00Z",
        type: "asset_added",
        portfolio_id: "portfolio1",
        asset_name: "GOOGL",
        asset_type: "stock",
        quantity: 5,
        price: 120,
        total_value: 600,
        user_id: "user1",
      },
      {
        timestamp: "2024-01-04T00:00:00Z",
        type: "portfolio_value",
        portfolio_id: "portfolio1",
        portfolio_name: "Growth Portfolio",
        total_value: 2200,
        asset_count: 2,
        currency: "USD",
        daily_return: 0.01,
        total_return: 0.05,
      },
    ];
  });

  describe("constructor", () => {
    test("creates aggregator with empty events", () => {
      // Assert
      const events = aggregator.getPortfolioCreationEvents();
      expect(events).toEqual([]);
    });

    test("creates aggregator with initial events", () => {
      // Act
      aggregator = new PortfolioAggregator(sampleEvents);

      // Assert
      const creationEvents = aggregator.getPortfolioCreationEvents();
      expect(creationEvents).toHaveLength(1);
      expect(creationEvents[0]?.portfolio_id).toBe("portfolio1");
    });

    test("creates copy of events array", () => {
      // Arrange
      aggregator = new PortfolioAggregator(sampleEvents);

      // Act - modify original array
      sampleEvents.push({
        timestamp: "2024-01-05T00:00:00Z",
        type: "portfolio_value",
        portfolio_id: "portfolio1",
        portfolio_name: "Growth Portfolio",
        total_value: 2500,
        asset_count: 2,
        currency: "USD",
      });

      // Assert - aggregator should not be affected
      const valueEvents = aggregator.getPortfolioValueEvents();
      expect(valueEvents).toHaveLength(1);
    });
  });

  describe("updateEvents", () => {
    test("updates events with new array", () => {
      // Act
      aggregator.updateEvents(sampleEvents);

      // Assert
      expect(aggregator.getPortfolioCreationEvents()).toHaveLength(1);
    });

    test("replaces existing events", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);
      expect(aggregator.getPortfolioCreationEvents()).toHaveLength(1);

      // Act
      aggregator.updateEvents([
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user1",
        },
      ]);

      // Assert
      const creationEvents = aggregator.getPortfolioCreationEvents();
      expect(creationEvents).toHaveLength(1);
      expect(creationEvents[0]?.portfolio_id).toBe("portfolio2");
    });

    test("clears events when empty array is passed", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);
      expect(aggregator.getPortfolioCreationEvents()).toHaveLength(1);

      // Act
      aggregator.updateEvents([]);

      // Assert
      expect(aggregator.getPortfolioCreationEvents()).toHaveLength(0);
    });
  });

  describe("getPortfolioCreationEvents", () => {
    test("returns empty array when no creation events", () => {
      // Act
      const result = aggregator.getPortfolioCreationEvents();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns all portfolio creation events", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user2",
        },
      ]);

      // Act
      const result = aggregator.getPortfolioCreationEvents();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.portfolio_id).toBe("portfolio1");
      expect(result[1]?.portfolio_id).toBe("portfolio2");
    });
  });

  describe("getPortfolioUpdateEvents", () => {
    test("returns empty array when no update events", () => {
      // Act
      const result = aggregator.getPortfolioUpdateEvents();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns portfolio update events", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "portfolio_update",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          currency: "USD",
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.getPortfolioUpdateEvents();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.portfolio_id).toBe("portfolio1");
    });
  });

  describe("getAssetAddedEvents", () => {
    test("returns empty array when no asset added events", () => {
      // Act
      const result = aggregator.getAssetAddedEvents();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns all asset added events", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.getAssetAddedEvents();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.asset_name).toBe("AAPL");
      expect(result[1]?.asset_name).toBe("GOOGL");
    });
  });

  describe("getAssetRemovedEvents", () => {
    test("returns empty array when no asset removed events", () => {
      // Act
      const result = aggregator.getAssetRemovedEvents();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns asset removed events", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "asset_removed",
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 5,
          price: 160,
          total_value: 800,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.getAssetRemovedEvents();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.asset_name).toBe("AAPL");
    });
  });

  describe("getPortfolioValueEvents", () => {
    test("returns empty array when no value events", () => {
      // Act
      const result = aggregator.getPortfolioValueEvents();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns all portfolio value events", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          total_value: 2500,
          asset_count: 2,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.getPortfolioValueEvents();

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe("getRebalancingEvents", () => {
    test("returns empty array when no rebalancing events", () => {
      // Act
      const result = aggregator.getRebalancingEvents();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns rebalancing events", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "rebalancing",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          trigger_reason: "drift",
          strategy: "equal_weight",
          trades_executed: 5,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.getRebalancingEvents();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.trigger_reason).toBe("drift");
    });
  });

  describe("filterByPortfolio", () => {
    test("returns empty array when no events", () => {
      // Act
      const result = aggregator.filterByPortfolio("portfolio1");

      // Assert
      expect(result).toEqual([]);
    });

    test("returns all events for specified portfolio", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.filterByPortfolio("portfolio1");

      // Assert
      expect(result).toHaveLength(4);
      expect(result.every((e) =>
        "portfolio_id" in e && e.portfolio_id === "portfolio1"
      )).toBe(true);
    });

    test("returns empty array for non-existent portfolio", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.filterByPortfolio("nonexistent");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("filterByUser", () => {
    test("returns empty array when no events", () => {
      // Act
      const result = aggregator.filterByUser("user1");

      // Assert
      expect(result).toEqual([]);
    });

    test("returns all events for specified user", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user2",
        },
      ]);

      // Act
      const result = aggregator.filterByUser("user1");

      // Assert - 3 events have user_id "user1" (portfolio_creation, 2 asset_added)
      // portfolio_value does not have a user_id field
      expect(result).toHaveLength(3);
    });

    test("returns empty array for non-existent user", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.filterByUser("nonexistent");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("filterByDateRange", () => {
    test("returns empty array when no events", () => {
      // Act
      const result = aggregator.filterByDateRange(
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      // Assert
      expect(result).toEqual([]);
    });

    test("returns events within date range", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          total_value: 3000,
          asset_count: 2,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.filterByDateRange(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-01-04T23:59:59Z")
      );

      // Assert
      expect(result).toHaveLength(4);
    });

    test("returns empty array when no events in range", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.filterByDateRange(
        new Date("2024-02-01"),
        new Date("2024-02-28")
      );

      // Assert
      expect(result).toEqual([]);
    });

    test("includes events at range boundaries", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.filterByDateRange(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-01-04T00:00:00Z")
      );

      // Assert
      expect(result).toHaveLength(4);
    });
  });

  describe("aggregate", () => {
    test("returns empty result when no events", () => {
      // Act
      const result = aggregator.aggregate();

      // Assert
      expect(result.total_portfolios).toBe(0);
      expect(result.total_assets).toBe(0);
      expect(result.total_value).toBe(0);
      expect(result.portfolio_metrics).toEqual({});
      expect(result.asset_allocation).toEqual({});
      expect(result.rebalancing_metrics).toEqual({});
    });

    test("aggregates all events", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.aggregate();

      // Assert
      expect(result.total_portfolios).toBe(1);
      expect(result.total_assets).toBe(2);
      expect(result.total_value).toBe(2200);
      expect(result.portfolio_metrics).toHaveProperty("portfolio1");
      expect(Object.keys(result.portfolio_metrics)).toHaveLength(1);
    });

    test("filters by portfolio IDs when specified", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user1",
        },
        {
          timestamp: "2024-02-02T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          total_value: 5500,
          asset_count: 1,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.aggregate(["portfolio1"]);

      // Assert
      expect(result.total_portfolios).toBe(1);
      expect(result.portfolio_metrics).toHaveProperty("portfolio1");
      expect(result.portfolio_metrics).not.toHaveProperty("portfolio2");
    });

    test("computes portfolio metrics correctly", () => {
      // Arrange
      aggregator.updateEvents(sampleEvents);

      // Act
      const result = aggregator.aggregate();
      const metrics = result.portfolio_metrics["portfolio1"];

      // Assert
      expect(metrics).toBeDefined();
      expect(metrics?.portfolio_name).toBe("Growth Portfolio");
      expect(metrics?.current_value).toBe(2200);
      expect(metrics?.asset_count).toBe(2);
      expect(metrics?.currency).toBe("USD");
      expect(metrics?.daily_return).toBe(0.01);
      expect(metrics?.total_return).toBe(0.05);
    });

    test("computes asset allocation correctly", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "BOND1",
          asset_type: "bond",
          quantity: 10,
          price: 100,
          total_value: 1000,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.aggregate();

      // Assert
      expect(result.asset_allocation).toHaveProperty("stock");
      expect(result.asset_allocation).toHaveProperty("bond");
      expect(result.asset_allocation.stock?.total_value).toBe(2100);
      expect(result.asset_allocation.bond?.total_value).toBe(1000);
    });

    test("computes rebalancing metrics correctly", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "rebalancing",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          trigger_reason: "drift",
          strategy: "equal_weight",
          trades_executed: 5,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "rebalancing",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          trigger_reason: "time",
          strategy: "equal_weight",
          trades_executed: 3,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.aggregate();
      const rebalancingMetrics = result.rebalancing_metrics["portfolio1"];

      // Assert
      expect(rebalancingMetrics).toBeDefined();
      expect(rebalancingMetrics?.total_rebalances).toBe(2);
      expect(rebalancingMetrics?.total_trades_executed).toBe(8);
      expect(rebalancingMetrics?.by_trigger_reason?.drift).toBe(1);
      expect(rebalancingMetrics?.by_trigger_reason?.time).toBe(1);
    });

    test("generates top portfolios list", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user1",
        },
        {
          timestamp: "2024-02-02T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          total_value: 5500,
          asset_count: 1,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.aggregate();

      // Assert
      expect(result.top_portfolios).toHaveLength(2);
      expect(result.top_portfolios[0]).toBe("portfolio2"); // Higher value
      expect(result.top_portfolios[1]).toBe("portfolio1");
    });

    test("generates top asset types list", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "BOND1",
          asset_type: "bond",
          quantity: 10,
          price: 100,
          total_value: 1000,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.aggregate();

      // Assert
      expect(result.top_asset_types).toHaveLength(2);
      expect(result.top_asset_types[0]).toBe("stock"); // Higher allocation
      expect(result.top_asset_types[1]).toBe("bond");
    });
  });

  describe("computePortfolioSummaryMetrics", () => {
    test("returns empty object when no events", () => {
      // Act
      const result = aggregator.computePortfolioSummaryMetrics([], [], [], []);

      // Assert
      expect(result).toEqual({});
    });

    test("computes metrics from creation events", () => {
      // Arrange
      const creationEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "portfolio_creation" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          initial_value: 10000,
          currency: "USD",
          user_id: "user1",
          strategy: "growth",
        },
      ];

      // Act
      const result = aggregator.computePortfolioSummaryMetrics(
        creationEvents,
        [],
        [],
        []
      );

      // Assert
      expect(result["portfolio1"]).toBeDefined();
      expect(result["portfolio1"]?.initial_value).toBe(10000);
      expect(result["portfolio1"]?.strategy).toBe("growth");
    });

    test("updates metrics from value events", () => {
      // Arrange
      const creationEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "portfolio_creation" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          initial_value: 10000,
          currency: "USD",
          user_id: "user1",
        },
      ];
      const valueEvents = [
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "portfolio_value" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          total_value: 11000,
          asset_count: 5,
          currency: "USD",
          daily_return: 0.02,
          total_return: 0.10,
        },
      ];

      // Act
      const result = aggregator.computePortfolioSummaryMetrics(
        creationEvents,
        valueEvents,
        [],
        []
      );

      // Assert
      expect(result["portfolio1"]?.current_value).toBe(11000);
      expect(result["portfolio1"]?.asset_count).toBe(5);
      expect(result["portfolio1"]?.daily_return).toBe(0.02);
      expect(result["portfolio1"]?.total_return).toBe(0.10);
    });
  });

  describe("computeAssetAllocationMetrics", () => {
    test("returns empty object when no events", () => {
      // Act
      const result = aggregator.computeAssetAllocationMetrics([], [], []);

      // Assert
      expect(result).toEqual({});
    });

    test("computes allocation from asset added events", () => {
      // Arrange
      const assetAddedEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "asset_added" as const,
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 10,
          price: 150,
          total_value: 1500,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-02T00:00:00Z",
          type: "asset_added" as const,
          portfolio_id: "portfolio1",
          asset_name: "GOOGL",
          asset_type: "stock",
          quantity: 5,
          price: 120,
          total_value: 600,
          user_id: "user1",
        },
      ];

      // Act
      const result = aggregator.computeAssetAllocationMetrics(
        assetAddedEvents,
        [],
        []
      );

      // Assert
      expect(result["stock"]).toBeDefined();
      expect(result["stock"]?.total_value).toBe(2100);
      expect(result["stock"]?.asset_count).toBe(2);
    });

    test("subtracts removed assets", () => {
      // Arrange
      const assetAddedEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "asset_added" as const,
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 10,
          price: 150,
          total_value: 1500,
          user_id: "user1",
        },
      ];
      const assetRemovedEvents = [
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "asset_removed" as const,
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 5,
          price: 160,
          total_value: 800,
          user_id: "user1",
        },
      ];

      // Act
      const result = aggregator.computeAssetAllocationMetrics(
        assetAddedEvents,
        assetRemovedEvents,
        []
      );

      // Assert
      expect(result["stock"]?.total_value).toBe(700);
      // Asset count: added 1 asset, removed 1 asset = 0 assets remaining
      expect(result["stock"]?.asset_count).toBe(0);
    });

    test("computes allocation percentage", () => {
      // Arrange
      const assetAddedEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "asset_added" as const,
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 10,
          price: 100,
          total_value: 1000,
          user_id: "user1",
        },
      ];
      const valueEvents = [
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "portfolio_value" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Test Portfolio",
          total_value: 2000,
          asset_count: 1,
          currency: "USD",
        },
      ];

      // Act
      const result = aggregator.computeAssetAllocationMetrics(
        assetAddedEvents,
        [],
        valueEvents
      );

      // Assert
      expect(result["stock"]?.allocation_percentage).toBe(0.5);
    });
  });

  describe("computeRebalancingStatistics", () => {
    test("returns empty object when no events", () => {
      // Act
      const result = aggregator.computeRebalancingStatistics([]);

      // Assert
      expect(result).toEqual({});
    });

    test("computes rebalancing statistics", () => {
      // Arrange
      const rebalancingEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "rebalancing" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          trigger_reason: "drift",
          strategy: "equal_weight",
          trades_executed: 5,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "rebalancing" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          trigger_reason: "time",
          strategy: "equal_weight",
          trades_executed: 3,
          user_id: "user1",
        },
      ];

      // Act
      const result = aggregator.computeRebalancingStatistics(rebalancingEvents);

      // Assert
      expect(result["portfolio1"]).toBeDefined();
      expect(result["portfolio1"]?.total_rebalances).toBe(2);
      expect(result["portfolio1"]?.total_trades_executed).toBe(8);
      expect(result["portfolio1"]?.by_trigger_reason?.drift).toBe(1);
      expect(result["portfolio1"]?.by_trigger_reason?.time).toBe(1);
      expect(result["portfolio1"]?.by_strategy?.equal_weight).toBe(2);
    });

    test("handles multiple portfolios", () => {
      // Arrange
      const rebalancingEvents = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "rebalancing" as const,
          portfolio_id: "portfolio1",
          portfolio_name: "Portfolio 1",
          trigger_reason: "drift",
          strategy: "equal_weight",
          trades_executed: 5,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-02T00:00:00Z",
          type: "rebalancing" as const,
          portfolio_id: "portfolio2",
          portfolio_name: "Portfolio 2",
          trigger_reason: "time",
          strategy: "market_cap",
          trades_executed: 3,
          user_id: "user1",
        },
      ];

      // Act
      const result = aggregator.computeRebalancingStatistics(rebalancingEvents);

      // Assert
      expect(result["portfolio1"]).toBeDefined();
      expect(result["portfolio2"]).toBeDefined();
      expect(result["portfolio1"]?.total_rebalances).toBe(1);
      expect(result["portfolio2"]?.total_rebalances).toBe(1);
    });
  });

  describe("generateTimeSeries", () => {
    test("returns empty series when no events", () => {
      // Act
      const result = aggregator.generateTimeSeries(
        "day",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );

      // Assert
      expect(result.series).toHaveProperty("all");
      expect(result.series.all).toEqual([]);
    });

    test("generates daily time series", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          total_value: 2500,
          asset_count: 2,
          currency: "USD",
        },
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          total_value: 3000,
          asset_count: 2,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.generateTimeSeries(
        "day",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );

      // Assert
      expect(result.series.all).toBeDefined();
      expect(result.series.all?.length).toBeGreaterThanOrEqual(1);
    });

    test("filters by portfolio IDs", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          total_value: 5500,
          asset_count: 1,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.generateTimeSeries(
        "day",
        new Date("2024-01-01"),
        new Date("2024-02-28"),
        ["portfolio1"]
      );

      // Assert
      expect(result.series["portfolio1"]).toBeDefined();
      expect(result.series["portfolio2"]).toBeUndefined();
    });
  });

  describe("comparePortfolios", () => {
    test("returns empty comparison when no portfolios", () => {
      // Act
      const result = aggregator.comparePortfolios(["p1", "p2"], "value");

      // Assert
      expect(result.metrics).toEqual({});
      expect(result.best_performing).toBeUndefined();
      expect(result.worst_performing).toBeUndefined();
      expect(result.average).toBeUndefined();
    });

    test("compares portfolios by value", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          total_value: 5500,
          asset_count: 1,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.comparePortfolios(
        ["portfolio1", "portfolio2"],
        "value"
      );

      // Assert
      expect(result.best_performing).toBe("portfolio2");
      expect(result.worst_performing).toBe("portfolio1");
      expect(result.average).toBe((2200 + 5500) / 2);
    });

    test("compares portfolios by return", () => {
      // Arrange
      aggregator.updateEvents([
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio1",
          portfolio_name: "Portfolio 1",
          initial_value: 10000,
          currency: "USD",
          user_id: "user1",
        },
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Portfolio 1",
          total_value: 11000,
          asset_count: 1,
          currency: "USD",
          total_return: 0.10,
        },
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Portfolio 2",
          initial_value: 5000,
          currency: "USD",
          user_id: "user1",
        },
        {
          timestamp: "2024-01-10T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Portfolio 2",
          total_value: 5500,
          asset_count: 1,
          currency: "USD",
          total_return: 0.05,
        },
      ]);

      // Act
      const result = aggregator.comparePortfolios(
        ["portfolio1", "portfolio2"],
        "return"
      );

      // Assert
      expect(result.best_performing).toBe("portfolio1");
      expect(result.worst_performing).toBe("portfolio2");
      // Use toBeCloseTo for floating point comparison
      expect(result.average).toBeCloseTo(0.075);
    });
  });

  describe("getSummary", () => {
    test("returns zero summary when no events", () => {
      // Act
      const result = aggregator.getSummary();

      // Assert
      expect(result.total_portfolios).toBe(0);
      expect(result.total_assets_added).toBe(0);
      expect(result.total_assets_removed).toBe(0);
      expect(result.total_value).toBe(0);
      expect(result.total_rebalances).toBe(0);
      expect(result.unique_users).toBe(0);
      expect(result.unique_strategies).toBe(0);
    });

    test("computes summary statistics", () => {
      // Arrange
      aggregator.updateEvents([
        ...sampleEvents,
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "rebalancing",
          portfolio_id: "portfolio1",
          portfolio_name: "Growth Portfolio",
          trigger_reason: "drift",
          strategy: "equal_weight",
          trades_executed: 5,
          user_id: "user1",
        },
        {
          timestamp: "2024-02-01T00:00:00Z",
          type: "portfolio_creation",
          portfolio_id: "portfolio2",
          portfolio_name: "Value Portfolio",
          initial_value: 5000,
          currency: "USD",
          user_id: "user2",
          strategy: "value",
        },
      ]);

      // Act
      const result = aggregator.getSummary();

      // Assert
      expect(result.total_portfolios).toBe(2);
      expect(result.total_assets_added).toBe(2);
      expect(result.total_assets_removed).toBe(0);
      expect(result.total_value).toBe(2200);
      expect(result.total_rebalances).toBe(1);
      expect(result.unique_users).toBe(2);
      // 3 unique strategies: "growth", "value", "equal_weight"
      expect(result.unique_strategies).toBe(3);
    });
  });

  describe("getTopPortfoliosByValue", () => {
    test("returns empty array when no events", () => {
      // Act
      const result = aggregator.getTopPortfoliosByValue();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns portfolios sorted by value", () => {
      // Arrange
      aggregator.updateEvents([
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Portfolio 1",
          total_value: 1000,
          asset_count: 1,
          currency: "USD",
        },
        {
          timestamp: "2024-01-02T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Portfolio 2",
          total_value: 5000,
          asset_count: 1,
          currency: "USD",
        },
        {
          timestamp: "2024-01-03T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio3",
          portfolio_name: "Portfolio 3",
          total_value: 3000,
          asset_count: 1,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.getTopPortfoliosByValue();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]?.portfolio_id).toBe("portfolio2");
      expect(result[1]?.portfolio_id).toBe("portfolio3");
      expect(result[2]?.portfolio_id).toBe("portfolio1");
    });

    test("respects limit parameter", () => {
      // Arrange
      aggregator.updateEvents([
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio1",
          portfolio_name: "Portfolio 1",
          total_value: 1000,
          asset_count: 1,
          currency: "USD",
        },
        {
          timestamp: "2024-01-02T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio2",
          portfolio_name: "Portfolio 2",
          total_value: 5000,
          asset_count: 1,
          currency: "USD",
        },
        {
          timestamp: "2024-01-03T00:00:00Z",
          type: "portfolio_value",
          portfolio_id: "portfolio3",
          portfolio_name: "Portfolio 3",
          total_value: 3000,
          asset_count: 1,
          currency: "USD",
        },
      ]);

      // Act
      const result = aggregator.getTopPortfoliosByValue(2);

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe("getTopAssets", () => {
    test("returns empty array when no events", () => {
      // Act
      const result = aggregator.getTopAssets();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns assets sorted by total value", () => {
      // Arrange
      aggregator.updateEvents([
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 10,
          price: 150,
          total_value: 1500,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-02T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "GOOGL",
          asset_type: "stock",
          quantity: 20,
          price: 120,
          total_value: 2400,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-03T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "MSFT",
          asset_type: "stock",
          quantity: 5,
          price: 300,
          total_value: 1500,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.getTopAssets();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]?.asset_name).toBe("GOOGL");
      expect(result[1]?.asset_name).toBe("AAPL");
      expect(result[2]?.asset_name).toBe("MSFT");
    });

    test("handles asset removals", () => {
      // Arrange
      aggregator.updateEvents([
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 10,
          price: 150,
          total_value: 1500,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-05T00:00:00Z",
          type: "asset_removed",
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 5,
          price: 160,
          total_value: 800,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.getTopAssets();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.asset_name).toBe("AAPL");
      expect(result[0]?.total_value).toBe(700);
    });

    test("respects limit parameter", () => {
      // Arrange
      aggregator.updateEvents([
        {
          timestamp: "2024-01-01T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 10,
          price: 150,
          total_value: 1500,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-02T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "GOOGL",
          asset_type: "stock",
          quantity: 20,
          price: 120,
          total_value: 2400,
          user_id: "user1",
        },
        {
          timestamp: "2024-01-03T00:00:00Z",
          type: "asset_added",
          portfolio_id: "portfolio1",
          asset_name: "MSFT",
          asset_type: "stock",
          quantity: 5,
          price: 300,
          total_value: 1500,
          user_id: "user1",
        },
      ]);

      // Act
      const result = aggregator.getTopAssets(2);

      // Assert
      expect(result).toHaveLength(2);
    });
  });
});

describe("helper functions", () => {
  describe("createPortfolioAggregationResult", () => {
    test("creates empty aggregation result", () => {
      // Act
      const result = createPortfolioAggregationResult();

      // Assert
      expect(result.total_portfolios).toBe(0);
      expect(result.total_assets).toBe(0);
      expect(result.total_value).toBe(0);
      expect(result.portfolio_metrics).toEqual({});
      expect(result.asset_allocation).toEqual({});
      expect(result.rebalancing_metrics).toEqual({});
      expect(result.top_portfolios).toEqual([]);
      expect(result.top_asset_types).toEqual([]);
    });
  });

  describe("createPortfolioSummaryMetrics", () => {
    test("creates empty portfolio summary metrics", () => {
      // Act
      const result = createPortfolioSummaryMetrics("test_id", "Test Portfolio");

      // Assert
      expect(result.portfolio_id).toBe("test_id");
      expect(result.portfolio_name).toBe("Test Portfolio");
      expect(result.created_at).toBeUndefined();
      expect(result.current_value).toBeUndefined();
      expect(result.initial_value).toBeUndefined();
      expect(result.total_return).toBeUndefined();
      expect(result.daily_return).toBeUndefined();
      expect(result.asset_count).toBe(0);
      expect(result.last_updated).toBeUndefined();
      expect(result.currency).toBe("USD");
      expect(result.strategy).toBeUndefined();
    });
  });

  describe("createAssetAllocationMetrics", () => {
    test("creates empty asset allocation metrics", () => {
      // Act
      const result = createAssetAllocationMetrics("stock");

      // Assert
      expect(result.asset_type).toBe("stock");
      expect(result.total_value).toBe(0);
      expect(result.allocation_percentage).toBe(0);
      expect(result.asset_count).toBe(0);
      expect(result.top_assets).toEqual([]);
    });
  });

  describe("createRebalancingStatistics", () => {
    test("creates empty rebalancing statistics", () => {
      // Act
      const result = createRebalancingStatistics("test_id", "Test Portfolio");

      // Assert
      expect(result.portfolio_id).toBe("test_id");
      expect(result.portfolio_name).toBe("Test Portfolio");
      expect(result.total_rebalances).toBe(0);
      expect(result.by_trigger_reason).toEqual({});
      expect(result.by_strategy).toEqual({});
      expect(result.total_trades_executed).toBe(0);
      expect(result.last_rebalanced).toBeUndefined();
    });
  });

  describe("createCrossPortfolioComparison", () => {
    test("creates empty cross portfolio comparison", () => {
      // Act
      const result = createCrossPortfolioComparison(["p1", "p2"], "value");

      // Assert
      expect(result.portfolio_ids).toEqual(["p1", "p2"]);
      expect(result.comparison_type).toBe("value");
      expect(result.metrics).toEqual({});
      expect(result.best_performing).toBeUndefined();
      expect(result.worst_performing).toBeUndefined();
      expect(result.average).toBeUndefined();
    });
  });

  describe("type guard functions", () => {
    test("isPortfolioCreationEvent returns true for portfolio creation", () => {
      // Arrange
      const event: AnalyticsEvent = {
        timestamp: "2024-01-01T00:00:00Z",
        type: "portfolio_creation",
        portfolio_id: "portfolio1",
        portfolio_name: "Test",
        initial_value: 1000,
        currency: "USD",
        user_id: "user1",
      };

      // Act & Assert
      expect(isPortfolioCreationEvent(event)).toBe(true);
    });

    test("isPortfolioCreationEvent returns false for other events", () => {
      // Arrange
      const event: AnalyticsEvent = {
        timestamp: "2024-01-01T00:00:00Z",
        type: "asset_added",
        portfolio_id: "portfolio1",
        asset_name: "AAPL",
        asset_type: "stock",
        quantity: 10,
        price: 150,
        total_value: 1500,
        user_id: "user1",
      };

      // Act & Assert
      expect(isPortfolioCreationEvent(event)).toBe(false);
    });

    test("isAssetAddedEvent returns true for asset added", () => {
      // Arrange
      const event: AnalyticsEvent = {
        timestamp: "2024-01-01T00:00:00Z",
        type: "asset_added",
        portfolio_id: "portfolio1",
        asset_name: "AAPL",
        asset_type: "stock",
        quantity: 10,
        price: 150,
        total_value: 1500,
        user_id: "user1",
      };

      // Act & Assert
      expect(isAssetAddedEvent(event)).toBe(true);
    });

    test("isRebalancingEvent returns true for rebalancing", () => {
      // Arrange
      const event: AnalyticsEvent = {
        timestamp: "2024-01-01T00:00:00Z",
        type: "rebalancing",
        portfolio_id: "portfolio1",
        portfolio_name: "Test",
        trigger_reason: "drift",
        strategy: "equal_weight",
        trades_executed: 5,
        user_id: "user1",
      };

      // Act & Assert
      expect(isRebalancingEvent(event)).toBe(true);
    });

    test("isPortfolioValueEvent returns true for portfolio value", () => {
      // Arrange
      const event: AnalyticsEvent = {
        timestamp: "2024-01-01T00:00:00Z",
        type: "portfolio_value",
        portfolio_id: "portfolio1",
        portfolio_name: "Test",
        total_value: 1000,
        asset_count: 1,
        currency: "USD",
      };

      // Act & Assert
      expect(isPortfolioValueEvent(event)).toBe(true);
    });
  });
});

describe("convenience functions", () => {
  test("aggregatePortfolio creates aggregator and aggregates", () => {
    // Arrange
    const events: AnalyticsEvent[] = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        type: "portfolio_value",
        portfolio_id: "portfolio1",
        portfolio_name: "Test",
        total_value: 1000,
        asset_count: 1,
        currency: "USD",
      },
    ];

    // Act
    const result = aggregatePortfolio(events);

    // Assert
    expect(result.total_value).toBe(1000);
    expect(result.total_portfolios).toBe(1);
  });

  test("computePortfolioSummaryMetrics creates aggregator and computes", () => {
    // Arrange
    const events: AnalyticsEvent[] = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        type: "portfolio_value",
        portfolio_id: "portfolio1",
        portfolio_name: "Test",
        total_value: 1000,
        asset_count: 1,
        currency: "USD",
      },
    ];

    // Act
    const result = computePortfolioSummaryMetrics(events);

    // Assert
    expect(result["portfolio1"]).toBeDefined();
    expect(result["portfolio1"]?.current_value).toBe(1000);
  });

  test("computeAssetAllocation creates aggregator and computes", () => {
    // Arrange
    const events: AnalyticsEvent[] = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        type: "asset_added",
        portfolio_id: "portfolio1",
        asset_name: "AAPL",
        asset_type: "stock",
        quantity: 10,
        price: 150,
        total_value: 1500,
        user_id: "user1",
      },
    ];

    // Act
    const result = computeAssetAllocation(events);

    // Assert
    expect(result["stock"]).toBeDefined();
    expect(result["stock"]?.total_value).toBe(1500);
  });

  test("computeRebalancingStatistics creates aggregator and computes", () => {
    // Arrange
    const events: AnalyticsEvent[] = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        type: "rebalancing",
        portfolio_id: "portfolio1",
        portfolio_name: "Test",
        trigger_reason: "drift",
        strategy: "equal_weight",
        trades_executed: 5,
        user_id: "user1",
      },
    ];

    // Act
    const result = computeRebalancingStatistics(events);

    // Assert
    expect(result["portfolio1"]).toBeDefined();
    expect(result["portfolio1"]?.total_rebalances).toBe(1);
  });
});
