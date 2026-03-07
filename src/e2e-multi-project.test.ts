/**
 * End-to-End Test for Multi-Project Orchestration Flow
 *
 * Tests the complete multi-project orchestration workflow:
 * 1. Create shared configuration registry
 * 2. Register multiple projects with shared and project-specific configs
 * 3. Verify configuration merging (shared + project-specific overrides)
 * 4. Test cross-project agent delegation with namespacing
 * 5. Verify portfolio analytics aggregation across projects
 * 6. Test import/export of project configurations
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { rmSync, existsSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import {
  ProjectRegistry,
} from "./registry/project-registry.js";
import {
  MetaAgentRegistry,
} from "./agents/registry.js";
import { AnalyticsStorage } from "./analytics/storage.js";
import {
  PortfolioAggregator,
} from "./analytics/portfolio-aggregator.js";
import {
  exportProjectConfig,
  importProjectConfig,
} from "./config/project-io.js";
import type {
  ProjectConfig,
  SharedConfig,
  PortfolioConfig,
  OlimpusConfig,
  MetaAgentDef,
  RoutingContext,
  AnalyticsEvent,
  PortfolioCreationEvent,
  PortfolioValueEvent,
  AssetAddedEvent,
  RebalancingEvent,
} from "./config/schema.js";
import type {
  ProjectRegistryConfig,
} from "./config/schema.js";

describe("Multi-Project Orchestration End-to-End", () => {
  let tempDir: string;
  let analyticsFilePath: string;
  let analyticsStorage: AnalyticsStorage;
  let projectRegistry: ProjectRegistry;
  let agentRegistry: MetaAgentRegistry;
  let routingContext: RoutingContext;

  beforeEach(() => {
    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), "multi-project-e2e-test-"));
    analyticsFilePath = join(tempDir, "analytics.json");

    // Create analytics storage
    analyticsStorage = new AnalyticsStorage({
      enabled: true,
      storage_file: analyticsFilePath,
      max_events: 10000,
      retention_days: 90,
      auto_prune: false,
    });

    // Create routing context
    routingContext = {
      prompt: "test prompt",
      projectDir: tempDir,
      projectFiles: [],
      projectDeps: [],
    };
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("Step 1: Create shared configuration registry", () => {
    test("should initialize project registry with shared config", () => {
      // Arrange
      const sharedConfig: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "olimpus",
            max_delegation_depth: 3,
          },
          meta_agents: {
            "shared-router": {
              base_model: "gpt-4",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "keyword", keywords: ["code"], mode: "any" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
        },
        default_project: {
          analytics_enabled: true,
        },
      };

      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: true,
        enable_cross_project_delegation: true,
        agent_namespace_format: "{project_id}:{agent_name}",
        max_cross_project_depth: 5,
      };

      const registryConfig: ProjectRegistryConfig = {
        portfolio: portfolioConfig,
        shared_config: sharedConfig,
        projects: {},
      };

      // Act
      projectRegistry = new ProjectRegistry(registryConfig, analyticsStorage);

      // Assert
      expect(projectRegistry.getProjectCount()).toBe(0);
      expect(projectRegistry.getSharedConfig()).toEqual(sharedConfig);
      expect(projectRegistry.getPortfolioConfig()).toEqual(portfolioConfig);
      expect(projectRegistry.isCrossProjectDelegationEnabled()).toBe(true);
      expect(projectRegistry.isAggregationEnabled()).toBe(true);
      expect(projectRegistry.getMaxCrossProjectDepth()).toBe(5);
      expect(projectRegistry.getAgentNamespaceFormat()).toBe("{project_id}:{agent_name}");
    });

    test("should initialize project registry with default values", () => {
      // Act
      projectRegistry = new ProjectRegistry(undefined, analyticsStorage);

      // Assert
      expect(projectRegistry.getProjectCount()).toBe(0);
      expect(projectRegistry.getSharedConfig()).toBeNull();
      expect(projectRegistry.getPortfolioConfig()).toBeNull();
      expect(projectRegistry.isCrossProjectDelegationEnabled()).toBe(true); // default
      expect(projectRegistry.isAggregationEnabled()).toBe(true); // default
      expect(projectRegistry.getMaxCrossProjectDepth()).toBe(5); // default
    });
  });

  describe("Step 2: Register multiple projects with shared and project-specific configs", () => {
    beforeEach(() => {
      // Set up shared config
      const sharedConfig: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "olimpus",
            max_delegation_depth: 3,
          },
          meta_agents: {
            "shared-router": {
              base_model: "gpt-4",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "keyword", keywords: ["code"], mode: "any" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
          agents: {
            "hephaestus": {
              model: "gpt-4",
              temperature: 0.7,
            },
          },
        },
      };

      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: true,
        enable_cross_project_delegation: true,
        agent_namespace_format: "{project_id}:{agent_name}",
        max_cross_project_depth: 5,
      };

      projectRegistry = new ProjectRegistry({
        portfolio: portfolioConfig,
        shared_config: sharedConfig,
        projects: {},
      }, analyticsStorage);

      agentRegistry = new MetaAgentRegistry(3, undefined, analyticsStorage, projectRegistry);
    });

    test("should register multiple projects with individual configs", () => {
      // Arrange
      const project1Config: ProjectConfig = {
        project_id: "frontend-app",
        name: "Frontend Application",
        path: "/path/to/frontend",
        metadata: {
          description: "React frontend application",
          tags: ["frontend", "react"],
        },
        analytics_enabled: true,
      };

      const project2Config: ProjectConfig = {
        project_id: "backend-api",
        name: "Backend API",
        path: "/path/to/backend",
        metadata: {
          description: "Node.js API server",
          tags: ["backend", "nodejs"],
        },
        analytics_enabled: true,
      };

      const project3Config: ProjectConfig = {
        project_id: "mobile-app",
        name: "Mobile Application",
        path: "/path/to/mobile",
        metadata: {
          description: "React Native mobile app",
          tags: ["mobile", "react-native"],
        },
        analytics_enabled: false, // Analytics disabled
      };

      // Act
      projectRegistry.register("frontend-app", project1Config);
      projectRegistry.register("backend-api", project2Config);
      projectRegistry.register("mobile-app", project3Config);

      // Assert
      expect(projectRegistry.getProjectCount()).toBe(3);
      expect(projectRegistry.has("frontend-app")).toBe(true);
      expect(projectRegistry.has("backend-api")).toBe(true);
      expect(projectRegistry.has("mobile-app")).toBe(true);
      expect(projectRegistry.get("frontend-app")).toEqual(project1Config);
      expect(projectRegistry.get("backend-api")).toEqual(project2Config);
      expect(projectRegistry.get("mobile-app")).toEqual(project3Config);

      // Verify analytics filtering
      const analyticsEnabledProjects = projectRegistry.getAnalyticsEnabledProjects();
      expect(analyticsEnabledProjects).toHaveLength(2);
      expect(analyticsEnabledProjects.map((p) => p.project_id)).toEqual(["frontend-app", "backend-api"]);
    });

    test("should retrieve projects by tag", () => {
      // Arrange
      projectRegistry.register("frontend-app", {
        project_id: "frontend-app",
        metadata: { tags: ["frontend", "react"] },
        analytics_enabled: true,
      });
      projectRegistry.register("backend-api", {
        project_id: "backend-api",
        metadata: { tags: ["backend", "nodejs"] },
        analytics_enabled: true,
      });
      projectRegistry.register("mobile-app", {
        project_id: "mobile-app",
        metadata: { tags: ["mobile", "react"] },
        analytics_enabled: true,
      });

      // Act
      const reactProjects = projectRegistry.getProjectsByTag("react");
      const backendProjects = projectRegistry.getProjectsByTag("backend");

      // Assert
      expect(reactProjects).toHaveLength(2);
      expect(reactProjects.map((p) => p.project_id)).toEqual(["frontend-app", "mobile-app"]);
      expect(backendProjects).toHaveLength(1);
      expect(backendProjects[0]!.project_id).toBe("backend-api");
    });
  });

  describe("Step 3: Verify configuration merging (shared + project-specific overrides)", () => {
    beforeEach(() => {
      // Set up shared config with base settings
      const sharedConfig: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "olimpus",
            max_delegation_depth: 3,
            ultrawork_enabled: true,
          },
          meta_agents: {
            "shared-router": {
              base_model: "gpt-4",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "keyword", keywords: ["code"], mode: "any" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
          agents: {
            "hephaestus": {
              model: "gpt-4",
              temperature: 0.7,
            },
            "sisyphus": {
              model: "gpt-4",
              temperature: 0.5,
            },
          },
        },
      };

      projectRegistry = new ProjectRegistry({
        shared_config: sharedConfig,
        projects: {},
      }, analyticsStorage);
    });

    test("should merge shared config with project overrides", () => {
      // Arrange
      const projectConfig: ProjectConfig = {
        project_id: "frontend-app",
        overrides: {
          settings: {
            max_delegation_depth: 5, // Override shared setting
          },
          agents: {
            "hephaestus": {
              model: "gpt-4-turbo", // Override shared agent config
              temperature: 0.8,
            },
          },
        },
        analytics_enabled: true,
      };

      projectRegistry.register("frontend-app", projectConfig);

      // Act
      const mergedConfig = projectRegistry.getMergedConfig("frontend-app");

      // Assert
      expect(mergedConfig).not.toBeNull();
      expect(mergedConfig?.settings?.namespace_prefix).toBe("olimpus"); // From shared
      expect(mergedConfig?.settings?.max_delegation_depth).toBe(5); // Override from project
      expect(mergedConfig?.settings?.ultrawork_enabled).toBe(true); // From shared
      expect(mergedConfig?.agents?.hephaestus?.model).toBe("gpt-4-turbo"); // Override from project
      expect(mergedConfig?.agents?.hephaestus?.temperature).toBe(0.8); // Override from project
      expect(mergedConfig?.agents?.sisyphus?.model).toBe("gpt-4"); // From shared
      expect(mergedConfig?.meta_agents?.["shared-router"]?.base_model).toBe("gpt-4"); // From shared
    });

    test("should return null for non-existent project", () => {
      // Act
      const mergedConfig = projectRegistry.getMergedConfig("non-existent");

      // Assert
      expect(mergedConfig).toBeNull();
    });

    test("should handle project with no overrides", () => {
      // Arrange
      const projectConfig: ProjectConfig = {
        project_id: "simple-project",
        analytics_enabled: true,
      };

      projectRegistry.register("simple-project", projectConfig);

      // Act
      const mergedConfig = projectRegistry.getMergedConfig("simple-project");

      // Assert
      expect(mergedConfig).not.toBeNull();
      expect(mergedConfig?.settings?.namespace_prefix).toBe("olimpus"); // From shared
      expect(mergedConfig?.settings?.max_delegation_depth).toBe(3); // From shared
    });

    test("should merge meta_agent overrides correctly", () => {
      // Arrange
      const projectConfig: ProjectConfig = {
        project_id: "custom-meta-project",
        overrides: {
          meta_agents: {
            "shared-router": {
              base_model: "gpt-4-turbo", // Override base_model
              temperature: 0.9, // Add new field
              // delegates_to and routing_rules inherited from shared
            },
            "project-specific-router": {
              base_model: "gpt-3.5-turbo",
              delegates_to: ["oracle"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "oracle",
                },
              ],
            },
          },
        },
        analytics_enabled: true,
      };

      projectRegistry.register("custom-meta-project", projectConfig);

      // Act
      const mergedConfig = projectRegistry.getMergedConfig("custom-meta-project");

      // Assert
      expect(mergedConfig?.meta_agents?.["shared-router"]?.base_model).toBe("gpt-4-turbo"); // Overridden
      expect(mergedConfig?.meta_agents?.["shared-router"]?.delegates_to).toEqual(["sisyphus", "hephaestus"]); // From shared
      expect(mergedConfig?.meta_agents?.["shared-router"]?.routing_rules).toHaveLength(1); // From shared
      expect(mergedConfig?.meta_agents?.["shared-router"]?.temperature).toBe(0.9); // Added by project
      expect(mergedConfig?.meta_agents?.["project-specific-router"]?.base_model).toBe("gpt-3.5-turbo"); // Project-only
    });
  });

  describe("Step 4: Test cross-project agent delegation with namespacing", () => {
    beforeEach(() => {
      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: true,
        enable_cross_project_delegation: true,
        agent_namespace_format: "{project_id}:{agent_name}",
        max_cross_project_depth: 5,
      };

      projectRegistry = new ProjectRegistry({
        portfolio: portfolioConfig,
        projects: {},
      }, analyticsStorage);

      // Register projects
      projectRegistry.register("project-a", {
        project_id: "project-a",
        analytics_enabled: true,
      });
      projectRegistry.register("project-b", {
        project_id: "project-b",
        analytics_enabled: true,
      });

      agentRegistry = new MetaAgentRegistry(3, undefined, analyticsStorage, projectRegistry);
    });

    test("should format agent names with project namespace", () => {
      // Act
      const namespacedName1 = projectRegistry.formatAgentName("project-a", "code-reviewer");
      const namespacedName2 = projectRegistry.formatAgentName("project-b", "debug-helper");

      // Assert
      expect(namespacedName1).toBe("project-a:code-reviewer");
      expect(namespacedName2).toBe("project-b:debug-helper");
    });

    test("should parse namespaced agent names", () => {
      // Act
      const parsed1 = projectRegistry.parseAgentName("project-a:code-reviewer");
      const parsed2 = projectRegistry.parseAgentName("project-b:debug-helper");

      // Assert
      expect(parsed1).toEqual({ projectId: "project-a", agentName: "code-reviewer" });
      expect(parsed2).toEqual({ projectId: "project-b", agentName: "debug-helper" });
    });

    test("should detect namespaced agent names", () => {
      // Assert
      expect(agentRegistry.isNamespacedName("project-a:code-reviewer")).toBe(true);
      expect(agentRegistry.isNamespacedName("project-b:debug-helper")).toBe(true);
      expect(agentRegistry.isNamespacedName("code-reviewer")).toBe(false);
      expect(agentRegistry.isNamespacedName("debug-helper")).toBe(false);
    });

    test("should register and resolve namespaced meta-agents", () => {
      // Arrange
      const metaAgentDef: MetaAgentDef = {
        base_model: "gpt-4",
        delegates_to: ["project-b:debug-helper"], // Cross-project delegation
        routing_rules: [
          {
            matcher: { type: "keyword", keywords: ["review"], mode: "any" },
            target_agent: "hephaestus",
          },
        ],
      };

      // Act
      agentRegistry.register("project-a:main-router", metaAgentDef);

      // Assert
      const allAgents = agentRegistry.getAll();
      expect(allAgents["project-a:main-router"]).toBeDefined();
      expect(allAgents["project-a:main-router"]).toEqual(metaAgentDef);
    });

    test("should format agent names using registry from MetaAgentRegistry", () => {
      // Act
      const namespacedName = agentRegistry.formatAgentName("project-a", "code-reviewer");

      // Assert
      expect(namespacedName).toBe("project-a:code-reviewer");
    });

    test("should parse agent names using registry from MetaAgentRegistry", () => {
      // Act
      const parsed = agentRegistry.parseAgentName("project-a:code-reviewer");

      // Assert
      expect(parsed).toEqual({ projectId: "project-a", agentName: "code-reviewer" });
    });

    test("should check cross-project delegation settings", () => {
      // Assert
      expect(agentRegistry.isCrossProjectDelegationEnabled()).toBe(true);
      expect(agentRegistry.getMaxCrossProjectDepth()).toBe(5);
    });

    test("should detect circular dependencies with namespaced agents", () => {
      // Arrange
      agentRegistry.register("project-a:agent-1", {
        base_model: "gpt-4",
        delegates_to: ["project-b:agent-2"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "sisyphus" },
        ],
      });

      agentRegistry.register("project-b:agent-2", {
        base_model: "gpt-4",
        delegates_to: ["project-a:agent-3"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "hephaestus" },
        ],
      });

      agentRegistry.register("project-a:agent-3", {
        base_model: "gpt-4",
        delegates_to: ["project-a:agent-1"], // Circular back to start
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "oracle" },
        ],
      });

      // Act & Assert
      expect(agentRegistry.checkCircular("project-a:agent-1", "project-a:agent-3")).toBe(true);
    });

    test("should not detect circular dependency when within depth limits", () => {
      // Arrange
      agentRegistry.register("project-a:agent-1", {
        base_model: "gpt-4",
        delegates_to: ["project-b:agent-2"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "sisyphus" },
        ],
      });

      agentRegistry.register("project-b:agent-2", {
        base_model: "gpt-4",
        delegates_to: ["project-a:agent-3"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "hephaestus" },
        ],
      });

      agentRegistry.register("project-a:agent-3", {
        base_model: "gpt-4",
        delegates_to: [],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "oracle" },
        ],
      });

      // Act & Assert
      expect(agentRegistry.checkCircular("project-a:agent-1", "project-a:agent-3")).toBe(false);
    });

    test("should handle non-cross-project delegations correctly", () => {
      // Arrange - Disable cross-project delegation
      projectRegistry.setPortfolioConfig({
        enable_aggregation: true,
        enable_cross_project_delegation: false, // Disabled
        agent_namespace_format: "{project_id}:{agent_name}",
        max_cross_project_depth: 5,
      });

      agentRegistry.register("project-a:agent-1", {
        base_model: "gpt-4",
        delegates_to: ["project-a:agent-2"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "sisyphus" },
        ],
      });

      agentRegistry.register("project-a:agent-2", {
        base_model: "gpt-4",
        delegates_to: [],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "hephaestus" },
        ],
      });

      // Act & Assert
      expect(agentRegistry.isCrossProjectDelegationEnabled()).toBe(false);
      expect(agentRegistry.checkCircular("project-a:agent-1", "project-a:agent-2")).toBe(false);
    });
  });

  describe("Step 5: Verify portfolio analytics aggregation across projects", () => {
    beforeEach(() => {
      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: true,
        enable_cross_project_delegation: true,
        agent_namespace_format: "{project_id}:{agent_name}",
        max_cross_project_depth: 5,
      };

      projectRegistry = new ProjectRegistry({
        portfolio: portfolioConfig,
        projects: {},
      }, analyticsStorage);
    });

    test("should record portfolio events for different projects", () => {
      // Arrange - Record portfolio creation events for multiple projects
      const creationEvent1: PortfolioCreationEvent = {
        type: "portfolio_creation",
        timestamp: "2024-01-01T00:00:00.000Z",
        portfolio_id: "portfolio-1",
        portfolio_name: "Growth Portfolio",
        user_id: "user-1",
        initial_value: 100000,
        currency: "USD",
        strategy: "growth",
      };

      const creationEvent2: PortfolioCreationEvent = {
        type: "portfolio_creation",
        timestamp: "2024-01-02T00:00:00.000Z",
        portfolio_id: "portfolio-2",
        portfolio_name: "Income Portfolio",
        user_id: "user-1",
        initial_value: 50000,
        currency: "USD",
        strategy: "income",
      };

      const valueEvent1: PortfolioValueEvent = {
        type: "portfolio_value",
        timestamp: "2024-01-15T00:00:00.000Z",
        portfolio_id: "portfolio-1",
        portfolio_name: "Growth Portfolio",
        total_value: 105000,
        asset_count: 10,
        daily_return: 0.01,
        total_return: 0.05,
        currency: "USD",
      };

      const valueEvent2: PortfolioValueEvent = {
        type: "portfolio_value",
        timestamp: "2024-01-15T00:00:00.000Z",
        portfolio_id: "portfolio-2",
        portfolio_name: "Income Portfolio",
        total_value: 52000,
        asset_count: 5,
        daily_return: 0.005,
        total_return: 0.04,
        currency: "USD",
      };

      // Act
      analyticsStorage.recordEvent(creationEvent1 as AnalyticsEvent);
      analyticsStorage.recordEvent(creationEvent2 as AnalyticsEvent);
      analyticsStorage.recordEvent(valueEvent1 as AnalyticsEvent);
      analyticsStorage.recordEvent(valueEvent2 as AnalyticsEvent);

      // Assert
      expect(analyticsStorage.getEventCount()).toBe(4);

      // Get all events and verify they're stored
      const allEvents = analyticsStorage.getAllEvents();
      expect(allEvents).toHaveLength(4);
    });

    test("should aggregate portfolio analytics across multiple portfolios", () => {
      // Arrange - Record portfolio events
      const events: AnalyticsEvent[] = [
        {
          type: "portfolio_creation",
          timestamp: "2024-01-01T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Growth Portfolio",
          user_id: "user-1",
          initial_value: 100000,
          currency: "USD",
          strategy: "growth",
        },
        {
          type: "portfolio_creation",
          timestamp: "2024-01-02T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          portfolio_name: "Income Portfolio",
          user_id: "user-1",
          initial_value: 50000,
          currency: "USD",
          strategy: "income",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-03T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          asset_id: "asset-1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 100,
          price_per_unit: 150,
          total_value: 15000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-04T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          asset_id: "asset-2",
          asset_name: "GOOGL",
          asset_type: "stock",
          quantity: 50,
          price_per_unit: 140,
          total_value: 7000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "portfolio_value",
          timestamp: "2024-01-15T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Growth Portfolio",
          total_value: 105000,
          asset_count: 10,
          currency: "USD",
        },
        {
          type: "portfolio_value",
          timestamp: "2024-01-15T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          portfolio_name: "Income Portfolio",
          total_value: 52000,
          asset_count: 5,
          currency: "USD",
        },
      ];

      events.forEach((event) => analyticsStorage.recordEvent(event));

      // Act - Aggregate using PortfolioAggregator
      const aggregator = new PortfolioAggregator(analyticsStorage.getAllEvents());
      const result = aggregator.aggregate();

      // Assert
      expect(result.total_portfolios).toBe(2);
      expect(result.total_assets).toBe(2); // 2 assets added
      expect(result.total_value).toBe(157000); // 105000 + 52000
      expect(Object.keys(result.portfolio_metrics)).toHaveLength(2);

      // Verify portfolio metrics
      expect(result.portfolio_metrics["portfolio-1"]?.current_value).toBe(105000);
      expect(result.portfolio_metrics["portfolio-2"]?.current_value).toBe(52000);

      // Verify top portfolios
      expect(result.top_portfolios).toEqual(["portfolio-1", "portfolio-2"]);
    });

    test("should filter events by portfolio ID", () => {
      // Arrange
      const events: AnalyticsEvent[] = [
        {
          type: "portfolio_creation",
          timestamp: "2024-01-01T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Portfolio 1",
          user_id: "user-1",
          initial_value: 100000,
          currency: "USD",
        },
        {
          type: "portfolio_creation",
          timestamp: "2024-01-02T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          portfolio_name: "Portfolio 2",
          user_id: "user-1",
          initial_value: 50000,
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-03T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          asset_id: "asset-1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 100,
          price_per_unit: 150,
          total_value: 15000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-04T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          asset_id: "asset-2",
          asset_name: "GOOGL",
          asset_type: "stock",
          quantity: 50,
          price_per_unit: 140,
          total_value: 7000,
          user_id: "user-1",
          currency: "USD",
        },
      ];

      events.forEach((event) => analyticsStorage.recordEvent(event));

      // Act
      const aggregator = new PortfolioAggregator(analyticsStorage.getAllEvents());
      const portfolio1Events = aggregator.filterByPortfolio("portfolio-1");
      const portfolio2Events = aggregator.filterByPortfolio("portfolio-2");

      // Assert
      expect(portfolio1Events).toHaveLength(2); // creation + asset_added
      expect(portfolio2Events).toHaveLength(2); // creation + asset_added

      // Verify all events in portfolio1Events belong to portfolio-1
      for (const event of portfolio1Events) {
        if ("portfolio_id" in event) {
          expect(event.portfolio_id).toBe("portfolio-1");
        }
      }
    });

    test("should get summary statistics across all portfolios", () => {
      // Arrange
      const events: AnalyticsEvent[] = [
        {
          type: "portfolio_creation",
          timestamp: "2024-01-01T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Portfolio 1",
          user_id: "user-1",
          initial_value: 100000,
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-03T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          asset_id: "asset-1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 100,
          price_per_unit: 150,
          total_value: 15000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "rebalancing",
          timestamp: "2024-01-10T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Portfolio 1",
          strategy: "mean-variance",
          trigger_reason: "threshold",
          previous_allocation: {},
          new_allocation: {},
          trades_executed: 5,
          total_value_before: 100000,
          total_value_after: 100000,
          user_id: "user-1",
        },
      ];

      events.forEach((event) => analyticsStorage.recordEvent(event));

      // Act
      const aggregator = new PortfolioAggregator(analyticsStorage.getAllEvents());
      const summary = aggregator.getSummary();

      // Assert
      expect(summary.total_portfolios).toBe(1);
      expect(summary.total_assets_added).toBe(1);
      expect(summary.total_assets_removed).toBe(0);
      expect(summary.total_value).toBe(0); // No portfolio_value events
      expect(summary.total_rebalances).toBe(1);
      expect(summary.unique_users).toBe(1);
      expect(summary.unique_strategies).toBe(1); // mean-variance strategy
    });

    test("should compute asset allocation across portfolios", () => {
      // Arrange
      const events: AnalyticsEvent[] = [
        {
          type: "asset_added",
          timestamp: "2024-01-01T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          asset_id: "asset-1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 100,
          price_per_unit: 150,
          total_value: 15000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-02T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          asset_id: "asset-2",
          asset_name: "US10Y",
          asset_type: "bond",
          quantity: 1000,
          price_per_unit: 100,
          total_value: 100000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-03T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          asset_id: "asset-3",
          asset_name: "BTC",
          asset_type: "crypto",
          quantity: 1,
          price_per_unit: 50000,
          total_value: 50000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "portfolio_value",
          timestamp: "2024-01-15T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Portfolio 1",
          total_value: 115000,
          asset_count: 2,
          currency: "USD",
        },
        {
          type: "portfolio_value",
          timestamp: "2024-01-15T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          portfolio_name: "Portfolio 2",
          total_value: 50000,
          asset_count: 1,
          currency: "USD",
        },
      ];

      events.forEach((event) => analyticsStorage.recordEvent(event));

      // Act
      const aggregator = new PortfolioAggregator(analyticsStorage.getAllEvents());
      const aggregation = aggregator.aggregate();

      // Assert
      expect(Object.keys(aggregation.asset_allocation)).toHaveLength(3);

      // Check asset allocation percentages
      const totalValue = aggregation.total_value; // 115000 + 50000 = 165000
      expect(aggregation.asset_allocation["stock"]?.total_value).toBe(15000);
      expect(aggregation.asset_allocation["bond"]?.total_value).toBe(100000);
      expect(aggregation.asset_allocation["crypto"]?.total_value).toBe(50000);

      expect(aggregation.asset_allocation["stock"]?.allocation_percentage).toBeCloseTo(15000 / totalValue, 5);
      expect(aggregation.asset_allocation["bond"]?.allocation_percentage).toBeCloseTo(100000 / totalValue, 5);
      expect(aggregation.asset_allocation["crypto"]?.allocation_percentage).toBeCloseTo(50000 / totalValue, 5);
    });
  });

  describe("Step 6: Test import/export of project configurations", () => {
    beforeEach(() => {
      projectRegistry = new ProjectRegistry(undefined, analyticsStorage);
    });

    test("should export project configuration to file", async () => {
      // Arrange
      const olimpusConfig: OlimpusConfig = {
        meta_agents: {
          "code-reviewer": {
            base_model: "gpt-4",
            delegates_to: ["hephaestus", "sisyphus"],
            routing_rules: [
              {
                matcher: { type: "keyword", keywords: ["review", "code"], mode: "any" },
                target_agent: "hephaestus",
              },
            ],
          },
        },
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
        },
        agents: {
          "hephaestus": {
            model: "gpt-4",
            temperature: 0.7,
          },
        },
        categories: {},
      };

      // Act
      const exportPath = await exportProjectConfig(olimpusConfig, tempDir, {
        location: "project",
        validate: true,
        indent: 2,
      });

      // Assert
      expect(existsSync(exportPath)).toBe(true);
      expect(exportPath).toBe(join(tempDir, "olimpus.jsonc"));

      // Verify file content
      const content = readFileSync(exportPath, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.meta_agents).toBeDefined();
      expect(parsed.meta_agents["code-reviewer"]).toBeDefined();
      expect(parsed.settings?.namespace_prefix).toBe("olimpus");
    });

    test("should import project configuration from file", async () => {
      // Arrange - Create a config file
      const olimpusConfig: OlimpusConfig = {
        meta_agents: {
          "debug-helper": {
            base_model: "gpt-4",
            delegates_to: ["atlas", "prometheus"],
            routing_rules: [
              {
                matcher: { type: "keyword", keywords: ["bug", "debug"], mode: "any" },
                target_agent: "atlas",
              },
            ],
          },
        },
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 4,
        },
        agents: {
          "atlas": {
            model: "gpt-4",
            temperature: 0.5,
          },
        },
        categories: {},
      };

      const configPath = join(tempDir, "olimpus.jsonc");
      writeFileSync(configPath, JSON.stringify(olimpusConfig, null, 2), "utf-8");

      // Act
      const result = await importProjectConfig(tempDir, {
        location: "project",
        validate: true,
      });

      // Assert
      expect(result.config).toBeDefined();
      expect(result.config.meta_agents?.["debug-helper"]).toBeDefined();
      expect(result.config.settings?.namespace_prefix).toBe("olimpus");
      expect(result.config.settings?.max_delegation_depth).toBe(4);
      expect(result.warnings).toEqual([]);
    });

    test("should perform round-trip export and import", async () => {
      // Arrange
      const originalConfig: OlimpusConfig = {
        meta_agents: {
          "code-reviewer": {
            base_model: "gpt-4",
            delegates_to: ["hephaestus"],
            routing_rules: [
              {
                matcher: { type: "keyword", keywords: ["review"], mode: "any" },
                target_agent: "hephaestus",
              },
            ],
          },
        },
        settings: {
          namespace_prefix: "test",
          max_delegation_depth: 5,
        },
        agents: {
          "hephaestus": {
            model: "gpt-4",
            temperature: 0.8,
          },
        },
        categories: {},
      };

      // Act - Export
      const exportPath = await exportProjectConfig(originalConfig, tempDir);

      // Act - Import
      const result = await importProjectConfig(tempDir);

      // Assert
      expect(result.config.meta_agents).toEqual(originalConfig.meta_agents);
      expect(result.config.settings).toEqual(originalConfig.settings);
      expect(result.config.agents).toEqual(originalConfig.agents);
      expect(result.config.categories).toEqual(originalConfig.categories);
    });

    test("should export with custom indentation", async () => {
      // Arrange
      const olimpusConfig: OlimpusConfig = {
        settings: {
          namespace_prefix: "olimpus",
        },
        agents: {},
        categories: {},
      };

      // Act
      const exportPath = await exportProjectConfig(olimpusConfig, tempDir, {
        indent: 4,
      });

      // Assert - Verify indentation
      const content = readFileSync(exportPath, "utf-8");
      const lines = content.split("\n");
      expect(lines[1]!.startsWith("    ")).toBe(true); // 4 spaces
    });

    test("should create parent directories on export", async () => {
      // Arrange
      const olimpusConfig: OlimpusConfig = {
        settings: { namespace_prefix: "olimpus" },
        agents: {},
        categories: {},
      };

      // Act - This should create the directory if it doesn't exist
      const result = await exportProjectConfig(olimpusConfig, tempDir, {
        location: "project",
        createDir: true,
      });

      // Assert
      expect(existsSync(result)).toBe(true);
    });

    test("should handle invalid config on import", async () => {
      // Arrange - Create invalid config file
      const invalidConfig = { invalid_field: "value" };
      const configPath = join(tempDir, "olimpus.jsonc");
      writeFileSync(configPath, JSON.stringify(invalidConfig), "utf-8");

      // Act & Assert
      await expect(importProjectConfig(tempDir)).rejects.toThrow("Invalid olimpus config");
    });

    test("should handle non-existent file on import", async () => {
      // Act & Assert
      await expect(importProjectConfig(tempDir)).rejects.toThrow("Configuration file not found");
    });
  });

  describe("Complete End-to-End Workflow", () => {
    test("should demonstrate complete multi-project orchestration flow", async () => {
      // Step 1: Create shared configuration registry
      const sharedConfig: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "olimpus",
            max_delegation_depth: 3,
          },
          meta_agents: {
            "shared-router": {
              base_model: "gpt-4",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "keyword", keywords: ["code"], mode: "any" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
          agents: {
            "hephaestus": {
              model: "gpt-4",
              temperature: 0.7,
            },
          },
        },
      };

      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: true,
        enable_cross_project_delegation: true,
        agent_namespace_format: "{project_id}:{agent_name}",
        max_cross_project_depth: 5,
      };

      projectRegistry = new ProjectRegistry({
        portfolio: portfolioConfig,
        shared_config: sharedConfig,
        projects: {},
      }, analyticsStorage);

      // Verify shared config
      expect(projectRegistry.getSharedConfig()).toEqual(sharedConfig);
      expect(projectRegistry.isCrossProjectDelegationEnabled()).toBe(true);
      expect(projectRegistry.isAggregationEnabled()).toBe(true);

      // Step 2: Register multiple projects
      projectRegistry.register("frontend-app", {
        project_id: "frontend-app",
        name: "Frontend Application",
        overrides: {
          settings: {
            max_delegation_depth: 5,
          },
        },
        metadata: {
          tags: ["frontend", "react"],
        },
        analytics_enabled: true,
      });

      projectRegistry.register("backend-api", {
        project_id: "backend-api",
        name: "Backend API",
        overrides: {
          agents: {
            "hephaestus": {
              model: "gpt-4-turbo",
              temperature: 0.8,
            },
          },
        },
        metadata: {
          tags: ["backend", "nodejs"],
        },
        analytics_enabled: true,
      });

      projectRegistry.register("mobile-app", {
        project_id: "mobile-app",
        name: "Mobile Application",
        metadata: {
          tags: ["mobile"],
        },
        analytics_enabled: false,
      });

      expect(projectRegistry.getProjectCount()).toBe(3);
      expect(projectRegistry.getAnalyticsEnabledProjects()).toHaveLength(2);

      // Step 3: Verify configuration merging
      const frontendMerged = projectRegistry.getMergedConfig("frontend-app");
      expect(frontendMerged?.settings?.max_delegation_depth).toBe(5);
      expect(frontendMerged?.settings?.namespace_prefix).toBe("olimpus");

      const backendMerged = projectRegistry.getMergedConfig("backend-api");
      expect(backendMerged?.agents?.hephaestus?.model).toBe("gpt-4-turbo");
      expect(backendMerged?.settings?.namespace_prefix).toBe("olimpus");

      // Step 4: Test cross-project agent delegation
      agentRegistry = new MetaAgentRegistry(3, undefined, analyticsStorage, projectRegistry);

      const frontendRouter: MetaAgentDef = {
        base_model: "gpt-4",
        delegates_to: ["backend-api:code-reviewer"],
        routing_rules: [
          {
            matcher: { type: "keyword", keywords: ["review"], mode: "any" },
            target_agent: "hephaestus",
          },
        ],
      };

      agentRegistry.register("frontend-app:main-router", frontendRouter);

      expect(agentRegistry.formatAgentName("frontend-app", "main-router")).toBe("frontend-app:main-router");
      expect(agentRegistry.parseAgentName("frontend-app:main-router")).toEqual({
        projectId: "frontend-app",
        agentName: "main-router",
      });
      expect(agentRegistry.isNamespacedName("frontend-app:main-router")).toBe(true);

      // Step 5: Verify portfolio analytics aggregation
      const portfolioEvents: AnalyticsEvent[] = [
        {
          type: "portfolio_creation",
          timestamp: "2024-01-01T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Growth Portfolio",
          user_id: "user-1",
          initial_value: 100000,
          currency: "USD",
        },
        {
          type: "portfolio_creation",
          timestamp: "2024-01-02T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          portfolio_name: "Income Portfolio",
          user_id: "user-1",
          initial_value: 50000,
          currency: "USD",
        },
        {
          type: "asset_added",
          timestamp: "2024-01-03T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          asset_id: "asset-1",
          asset_name: "AAPL",
          asset_type: "stock",
          quantity: 100,
          price_per_unit: 150,
          total_value: 15000,
          user_id: "user-1",
          currency: "USD",
        },
        {
          type: "portfolio_value",
          timestamp: "2024-01-15T00:00:00.000Z",
          portfolio_id: "portfolio-1",
          portfolio_name: "Growth Portfolio",
          total_value: 105000,
          asset_count: 10,
          currency: "USD",
        },
        {
          type: "portfolio_value",
          timestamp: "2024-01-15T00:00:00.000Z",
          portfolio_id: "portfolio-2",
          portfolio_name: "Income Portfolio",
          total_value: 52000,
          asset_count: 5,
          currency: "USD",
        },
      ];

      portfolioEvents.forEach((event) => analyticsStorage.recordEvent(event));

      const aggregator = new PortfolioAggregator(analyticsStorage.getAllEvents());
      const aggregation = aggregator.aggregate();

      expect(aggregation.total_portfolios).toBe(2);
      expect(aggregation.total_value).toBe(157000);
      expect(Object.keys(aggregation.portfolio_metrics)).toHaveLength(2);

      // Step 6: Test import/export of project configurations
      const olimpusConfig: OlimpusConfig = {
        meta_agents: frontendRouter ? { "frontend-router": frontendRouter } : undefined,
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
        },
        agents: {
          "hephaestus": {
            model: "gpt-4",
            temperature: 0.7,
          },
        },
        categories: {},
      };

      const exportPath = await exportProjectConfig(olimpusConfig, tempDir);
      expect(existsSync(exportPath)).toBe(true);

      const importResult = await importProjectConfig(tempDir);
      expect(importResult.config.settings?.namespace_prefix).toBe("olimpus");

      // Final verification - all components working together
      expect(projectRegistry.getProjectCount()).toBe(3);
      expect(analyticsStorage.getEventCount()).toBe(5);
      expect(agentRegistry.getAll()["frontend-app:main-router"]).toBeDefined();
      expect(existsSync(exportPath)).toBe(true);
    });
  });
});
