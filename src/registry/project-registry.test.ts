import { test, expect, describe, beforeEach } from "bun:test";
import {
  ProjectRegistry,
} from "./project-registry.js";
import type {
  ProjectRegistryConfig,
  ProjectConfig,
  SharedConfig,
  PortfolioConfig,
  OlimpusConfig,
  MetaAgentDef,
} from "../config/schema.js";

describe("ProjectRegistry", () => {
  let registry: ProjectRegistry;

  beforeEach(() => {
    registry = new ProjectRegistry();
  });

  describe("constructor", () => {
    test("creates empty registry with default config", () => {
      // Assert
      expect(registry.getProjectCount()).toBe(0);
      expect(registry.getSharedConfig()).toBeNull();
      expect(registry.getPortfolioConfig()).toBeNull();
    });

    test("creates registry with initial projects", () => {
      // Arrange
      const config: ProjectRegistryConfig = {
        projects: {
          project1: {
            project_id: "project1",
            name: "Project 1",
            analytics_enabled: true,
          },
          project2: {
            project_id: "project2",
            name: "Project 2",
            analytics_enabled: false,
          },
        },
      };

      // Act
      registry = new ProjectRegistry(config);

      // Assert
      expect(registry.getProjectCount()).toBe(2);
      expect(registry.has("project1")).toBe(true);
      expect(registry.has("project2")).toBe(true);
    });

    test("creates registry with shared config", () => {
      // Arrange
      const config: ProjectRegistryConfig = {
        shared_config: {
          base_config: {
            meta_agents: {
              router: {
                base_model: "claude-3-5-sonnet",
                delegates_to: ["sisyphus"],
                routing_rules: [
                  {
                    matcher: { type: "always" },
                    target_agent: "sisyphus",
                  },
                ],
              },
            },
          },
        },
        projects: {},
      };

      // Act
      registry = new ProjectRegistry(config);

      // Assert
      const sharedConfig = registry.getSharedConfig();
      expect(sharedConfig).not.toBeNull();
      expect(sharedConfig?.base_config?.meta_agents).toBeDefined();
    });

    test("creates registry with portfolio config", () => {
      // Arrange
      const config: ProjectRegistryConfig = {
        portfolio: {
          enable_aggregation: false,
          enable_cross_project_delegation: false,
          agent_namespace_format: "{project_id}_{agent_name}",
          default_project_id: "project1",
          max_cross_project_depth: 5,
        },
      };

      // Act
      registry = new ProjectRegistry(config);

      // Assert
      const portfolioConfig = registry.getPortfolioConfig();
      expect(portfolioConfig).not.toBeNull();
      expect(portfolioConfig?.enable_aggregation).toBe(false);
      expect(portfolioConfig?.enable_cross_project_delegation).toBe(false);
      expect(portfolioConfig?.agent_namespace_format).toBe("{project_id}_{agent_name}");
    });

    test("creates registry with all configurations", () => {
      // Arrange
      const config: ProjectRegistryConfig = {
        portfolio: {
          enable_aggregation: true,
          enable_cross_project_delegation: false,
          agent_namespace_format: "{project_id}:{agent_name}",
          default_project_id: "default_project",
          max_cross_project_depth: 5,
        },
        shared_config: {
          base_config: {
            settings: {
              namespace_prefix: "test",
              max_delegation_depth: 3,
            },
          },
        },
        projects: {
          project1: {
            project_id: "project1",
            name: "Project 1",
            analytics_enabled: true,
          },
        },
      };

      // Act
      registry = new ProjectRegistry(config);

      // Assert
      expect(registry.getProjectCount()).toBe(1);
      expect(registry.getSharedConfig()).not.toBeNull();
      expect(registry.getPortfolioConfig()).not.toBeNull();
    });
  });

  describe("register", () => {
    test("registers a new project", () => {
      // Arrange
      const projectConfig: ProjectConfig = {
        project_id: "test_project",
        name: "Test Project",
        analytics_enabled: true,
      };

      // Act
      registry.register("test_project", projectConfig);

      // Assert
      expect(registry.has("test_project")).toBe(true);
      expect(registry.getProjectCount()).toBe(1);
    });

    test("overwrites existing project registration", () => {
      // Arrange
      const project1: ProjectConfig = {
        project_id: "test_project",
        name: "Original",
        analytics_enabled: true,
      };
      const project2: ProjectConfig = {
        project_id: "test_project",
        name: "Updated",
        analytics_enabled: true,
      };

      // Act
      registry.register("test_project", project1);
      registry.register("test_project", project2);

      // Assert
      const retrieved = registry.get("test_project");
      expect(retrieved?.name).toBe("Updated");
      expect(registry.getProjectCount()).toBe(1);
    });

    test("ensures project_id matches registration key", () => {
      // Arrange
      const projectConfig: ProjectConfig = {
        project_id: "wrong_id",
        name: "Test",
        analytics_enabled: true,
      };

      // Act
      registry.register("correct_id", projectConfig);

      // Assert
      const retrieved = registry.get("correct_id");
      expect(retrieved?.project_id).toBe("correct_id");
    });
  });

  describe("get", () => {
    test("returns project config when project exists", () => {
      // Arrange
      const projectConfig: ProjectConfig = {
        project_id: "test_project",
        name: "Test Project",
        analytics_enabled: true,
      };
      registry.register("test_project", projectConfig);

      // Act
      const result = registry.get("test_project");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.project_id).toBe("test_project");
      expect(result?.name).toBe("Test Project");
    });

    test("returns null when project does not exist", () => {
      // Act
      const result = registry.get("nonexistent");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    test("returns empty object when no projects", () => {
      // Act
      const result = registry.getAll();

      // Assert
      expect(result).toEqual({});
    });

    test("returns all registered projects", () => {
      // Arrange
      const projects: Record<string, ProjectConfig> = {
        project1: {
          project_id: "project1",
          name: "Project 1",
        },
        project2: {
          project_id: "project2",
          name: "Project 2",
        },
        project3: {
          project_id: "project3",
          name: "Project 3",
        },
      };

      for (const [id, config] of Object.entries(projects)) {
        registry.register(id, config);
      }

      // Act
      const result = registry.getAll();

      // Assert
      expect(Object.keys(result)).toHaveLength(3);
      expect(result.project1).toBeDefined();
      expect(result.project2).toBeDefined();
      expect(result.project3).toBeDefined();
      expect(result.project1?.name).toBe("Project 1");
    });
  });

  describe("has", () => {
    test("returns true for registered project", () => {
      // Arrange
      registry.register("test_project", { project_id: "test_project", analytics_enabled: true });

      // Act & Assert
      expect(registry.has("test_project")).toBe(true);
    });

    test("returns false for unregistered project", () => {
      // Act & Assert
      expect(registry.has("nonexistent")).toBe(false);
    });
  });

  describe("unregister", () => {
    test("removes registered project", () => {
      // Arrange
      registry.register("test_project", { project_id: "test_project", analytics_enabled: true });
      expect(registry.has("test_project")).toBe(true);

      // Act
      const result = registry.unregister("test_project");

      // Assert
      expect(result).toBe(true);
      expect(registry.has("test_project")).toBe(false);
      expect(registry.getProjectCount()).toBe(0);
    });

    test("returns false for non-existent project", () => {
      // Act
      const result = registry.unregister("nonexistent");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getMergedConfig", () => {
    test("returns null for non-existent project", () => {
      // Act
      const result = registry.getMergedConfig("nonexistent");

      // Assert
      expect(result).toBeNull();
    });

    test("returns project config when no shared config", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        overrides: {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
        },
      });

      // Act
      const result = registry.getMergedConfig("project1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.meta_agents?.router).toBeDefined();
      expect(result?.meta_agents?.router?.base_model).toBe("claude-3-5-sonnet");
    });

    test("merges shared base config with project overrides", () => {
      // Arrange
      const baseConfig: OlimpusConfig = {
        meta_agents: {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["sisyphus"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        },
        settings: {
          namespace_prefix: "shared",
          max_delegation_depth: 3,
        },
      };

      const sharedConfig: SharedConfig = {
        base_config: baseConfig,
      };

      registry.setSharedConfig(sharedConfig);

      registry.register("project1", {
        project_id: "project1",
        overrides: {
          meta_agents: {
            router: {
              base_model: "claude-3-5-opus",
              delegates_to: ["hephaestus"],
              routing_rules: [
                {
                  matcher: { type: "keyword", keywords: ["test"], mode: "any" },
                  target_agent: "hephaestus",
                },
              ],
            },
          },
          settings: {
            namespace_prefix: "project1",
            max_delegation_depth: 3,
          },
        },
      });

      // Act
      const result = registry.getMergedConfig("project1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.meta_agents?.router?.base_model).toBe("claude-3-5-opus");
      expect(result?.settings?.namespace_prefix).toBe("project1");
    });

    test("preserves shared config when no project overrides", () => {
      // Arrange
      const baseConfig: OlimpusConfig = {
        meta_agents: {
          router: {
            base_model: "claude-3-5-sonnet",
            delegates_to: ["sisyphus"],
            routing_rules: [
              {
                matcher: { type: "always" },
                target_agent: "sisyphus",
              },
            ],
          },
        },
      };

      const sharedConfig: SharedConfig = {
        base_config: baseConfig,
      };

      registry.setSharedConfig(sharedConfig);
      registry.register("project1", { project_id: "project1", analytics_enabled: true });

      // Act
      const result = registry.getMergedConfig("project1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.meta_agents?.router?.base_model).toBe("claude-3-5-sonnet");
    });

    test("merges multiple override sections", () => {
      // Arrange
      const baseConfig: OlimpusConfig = {
        agents: {
          sisyphus: {
            model: "claude-3-5-sonnet",
          },
        },
        categories: {
          coding: {
            description: "Coding tasks",
          },
        },
        skills: ["skill1"],
      };

      const sharedConfig: SharedConfig = {
        base_config: baseConfig,
      };

      registry.setSharedConfig(sharedConfig);

      registry.register("project1", {
        project_id: "project1",
        overrides: {
          agents: {
            hephaestus: {
              model: "claude-3-5-opus",
            },
          },
          categories: {
            research: {
              description: "Research tasks",
            },
          },
          skills: ["skill2", "skill3"],
        },
      });

      // Act
      const result = registry.getMergedConfig("project1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.agents?.sisyphus).toBeDefined();
      expect(result?.agents?.hephaestus).toBeDefined();
      expect(result?.categories?.coding).toBeDefined();
      expect(result?.categories?.research).toBeDefined();
      expect(result?.skills).toEqual(["skill1", "skill2", "skill3"]);
    });
  });

  describe("getSharedConfig", () => {
    test("returns null when no shared config", () => {
      // Act
      const result = registry.getSharedConfig();

      // Assert
      expect(result).toBeNull();
    });

    test("returns shared config when set", () => {
      // Arrange
      const sharedConfig: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "test",
            max_delegation_depth: 3,
          },
        },
      };
      registry.setSharedConfig(sharedConfig);

      // Act
      const result = registry.getSharedConfig();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.base_config?.settings?.namespace_prefix).toBe("test");
    });
  });

  describe("setSharedConfig", () => {
    test("sets shared config", () => {
      // Arrange
      const sharedConfig: SharedConfig = {
        base_config: {},
      };

      // Act
      registry.setSharedConfig(sharedConfig);

      // Assert
      expect(registry.getSharedConfig()).toBe(sharedConfig);
    });

    test("replaces existing shared config", () => {
      // Arrange
      const config1: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "first",
            max_delegation_depth: 3,
          },
        },
      };
      const config2: SharedConfig = {
        base_config: {
          settings: {
            namespace_prefix: "second",
            max_delegation_depth: 3,
          },
        },
      };

      registry.setSharedConfig(config1);

      // Act
      registry.setSharedConfig(config2);

      // Assert
      expect(registry.getSharedConfig()?.base_config?.settings?.namespace_prefix).toBe("second");
    });
  });

  describe("getPortfolioConfig", () => {
    test("returns null when no portfolio config", () => {
      // Act
      const result = registry.getPortfolioConfig();

      // Assert
      expect(result).toBeNull();
    });

    test("returns portfolio config when set", () => {
      // Arrange
      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: false,
        default_project_id: "project1",
      };
      registry.setPortfolioConfig(portfolioConfig);

      // Act
      const result = registry.getPortfolioConfig();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.enable_aggregation).toBe(false);
      expect(result?.default_project_id).toBe("project1");
    });
  });

  describe("setPortfolioConfig", () => {
    test("sets portfolio config", () => {
      // Arrange
      const portfolioConfig: PortfolioConfig = {
        enable_aggregation: true,
      };

      // Act
      registry.setPortfolioConfig(portfolioConfig);

      // Assert
      expect(registry.getPortfolioConfig()).toBe(portfolioConfig);
    });
  });

  describe("getDefaultProjectId", () => {
    test("returns null when no portfolio config", () => {
      // Act
      const result = registry.getDefaultProjectId();

      // Assert
      expect(result).toBeNull();
    });

    test("returns null when portfolio config has no default project", () => {
      // Arrange
      registry.setPortfolioConfig({ enable_aggregation: true });

      // Act
      const result = registry.getDefaultProjectId();

      // Assert
      expect(result).toBeNull();
    });

    test("returns default project id from portfolio config", () => {
      // Arrange
      registry.setPortfolioConfig({
        enable_aggregation: true,
        default_project_id: "my_project",
      });

      // Act
      const result = registry.getDefaultProjectId();

      // Assert
      expect(result).toBe("my_project");
    });
  });

  describe("isCrossProjectDelegationEnabled", () => {
    test("returns true by default", () => {
      // Act
      const result = registry.isCrossProjectDelegationEnabled();

      // Assert
      expect(result).toBe(true);
    });

    test("returns false when explicitly disabled", () => {
      // Arrange
      registry.setPortfolioConfig({
        enable_cross_project_delegation: false,
      });

      // Act
      const result = registry.isCrossProjectDelegationEnabled();

      // Assert
      expect(result).toBe(false);
    });

    test("returns true when explicitly enabled", () => {
      // Arrange
      registry.setPortfolioConfig({
        enable_cross_project_delegation: true,
      });

      // Act
      const result = registry.isCrossProjectDelegationEnabled();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("isAggregationEnabled", () => {
    test("returns true by default", () => {
      // Act
      const result = registry.isAggregationEnabled();

      // Assert
      expect(result).toBe(true);
    });

    test("returns false when explicitly disabled", () => {
      // Arrange
      registry.setPortfolioConfig({
        enable_aggregation: false,
      });

      // Act
      const result = registry.isAggregationEnabled();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getMaxCrossProjectDepth", () => {
    test("returns default value of 5", () => {
      // Act
      const result = registry.getMaxCrossProjectDepth();

      // Assert
      expect(result).toBe(5);
    });

    test("returns configured max depth", () => {
      // Arrange
      registry.setPortfolioConfig({
        max_cross_project_depth: 10,
      });

      // Act
      const result = registry.getMaxCrossProjectDepth();

      // Assert
      expect(result).toBe(10);
    });
  });

  describe("getAgentNamespaceFormat", () => {
    test("returns default format", () => {
      // Act
      const result = registry.getAgentNamespaceFormat();

      // Assert
      expect(result).toBe("{project_id}:{agent_name}");
    });

    test("returns configured format", () => {
      // Arrange
      registry.setPortfolioConfig({
        agent_namespace_format: "{project_id}_{agent_name}",
      });

      // Act
      const result = registry.getAgentNamespaceFormat();

      // Assert
      expect(result).toBe("{project_id}_{agent_name}");
    });
  });

  describe("formatAgentName", () => {
    test("formats agent name with default format", () => {
      // Act
      const result = registry.formatAgentName("project1", "agent1");

      // Assert
      expect(result).toBe("project1:agent1");
    });

    test("formats agent name with custom format", () => {
      // Arrange
      registry.setPortfolioConfig({
        agent_namespace_format: "{project_id}/{agent_name}",
      });

      // Act
      const result = registry.formatAgentName("project1", "agent1");

      // Assert
      expect(result).toBe("project1/agent1");
    });

    test("handles different format patterns", () => {
      // Arrange
      registry.setPortfolioConfig({
        agent_namespace_format: "[{agent_name}]@{project_id}",
      });

      // Act
      const result = registry.formatAgentName("my_project", "my_agent");

      // Assert
      expect(result).toBe("[my_agent]@my_project");
    });
  });

  describe("parseAgentName", () => {
    test("parses agent name with default format", () => {
      // Arrange
      registry.register("project1", { project_id: "project1", analytics_enabled: true });

      // Act
      const result = registry.parseAgentName("project1:agent1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.projectId).toBe("project1");
      expect(result?.agentName).toBe("agent1");
    });

    test("returns null for invalid format", () => {
      // Act
      const result = registry.parseAgentName("not_a_namespaced_name");

      // Assert
      expect(result).toBeNull();
    });

    test("returns null for empty parts", () => {
      // Act
      const result = registry.parseAgentName(":");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.projectId).toBe("");
      expect(result?.agentName).toBe("");
    });

    test("handles custom format with registered projects", () => {
      // Arrange
      registry.setPortfolioConfig({
        agent_namespace_format: "{project_id}_{agent_name}",
      });
      registry.register("project1", { project_id: "project1", analytics_enabled: true });

      // Act
      const result = registry.parseAgentName("project1_agent1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.projectId).toBe("project1");
      expect(result?.agentName).toBe("agent1");
    });
  });

  describe("getAnalyticsEnabledProjects", () => {
    test("returns empty array when no projects", () => {
      // Act
      const result = registry.getAnalyticsEnabledProjects();

      // Assert
      expect(result).toEqual([]);
    });

    test("returns projects with analytics enabled", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        analytics_enabled: true,
      });
      registry.register("project2", {
        project_id: "project2",
        analytics_enabled: false,
      });
      registry.register("project3", {
        project_id: "project3",
        analytics_enabled: true,
      });

      // Act
      const result = registry.getAnalyticsEnabledProjects();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some((p) => p.project_id === "project1")).toBe(true);
      expect(result.some((p) => p.project_id === "project3")).toBe(true);
      expect(result.some((p) => p.project_id === "project2")).toBe(false);
    });

    test("includes projects when analytics_enabled is set to true", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        analytics_enabled: true,
      });

      // Act
      const result = registry.getAnalyticsEnabledProjects();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.project_id).toBe("project1");
    });
  });

  describe("getProjectMetadata", () => {
    test("returns null when project does not exist", () => {
      // Act
      const result = registry.getProjectMetadata("nonexistent");

      // Assert
      expect(result).toBeNull();
    });

    test("returns null when project has no metadata", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
      });

      // Act
      const result = registry.getProjectMetadata("project1");

      // Assert
      expect(result).toBeNull();
    });

    test("returns project metadata", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        metadata: {
          description: "Test project",
          tags: ["test", "demo"],
          created_at: "2024-01-01T00:00:00Z",
        },
      });

      // Act
      const result = registry.getProjectMetadata("project1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.description).toBe("Test project");
      expect(result?.tags).toEqual(["test", "demo"]);
      expect(result?.created_at).toBe("2024-01-01T00:00:00Z");
    });
  });

  describe("getProjectsByTag", () => {
    test("returns empty array when no projects", () => {
      // Act
      const result = registry.getProjectsByTag("test");

      // Assert
      expect(result).toEqual([]);
    });

    test("returns projects with matching tag", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        metadata: {
          tags: ["test", "demo"],
        },
      });
      registry.register("project2", {
        project_id: "project2",
        metadata: {
          tags: ["production"],
        },
      });
      registry.register("project3", {
        project_id: "project3",
        metadata: {
          tags: ["test", "urgent"],
        },
      });

      // Act
      const result = registry.getProjectsByTag("test");

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some((p) => p.project_id === "project1")).toBe(true);
      expect(result.some((p) => p.project_id === "project3")).toBe(true);
      expect(result.some((p) => p.project_id === "project2")).toBe(false);
    });

    test("returns empty array when tag not found", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        metadata: {
          tags: ["test"],
        },
      });

      // Act
      const result = registry.getProjectsByTag("nonexistent");

      // Assert
      expect(result).toEqual([]);
    });

    test("handles projects without tags", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        metadata: {
          tags: ["test"],
        },
      });
      registry.register("project2", {
        project_id: "project2",
      });

      // Act
      const result = registry.getProjectsByTag("test");

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.project_id).toBe("project1");
    });
  });

  describe("update", () => {
    test("returns false for non-existent project", () => {
      // Act
      const result = registry.update("nonexistent", {
        name: "Updated",
      });

      // Assert
      expect(result).toBe(false);
    });

    test("updates existing project", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        name: "Original",
      });

      // Act
      const result = registry.update("project1", {
        name: "Updated",
        analytics_enabled: false,
      });

      // Assert
      expect(result).toBe(true);
      const updated = registry.get("project1");
      expect(updated?.name).toBe("Updated");
      expect(updated?.analytics_enabled).toBe(false);
    });

    test("preserves project_id when updating", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
      });

      // Act
      registry.update("project1", {
        project_id: "wrong_id", // This should be ignored
      });

      // Assert
      const updated = registry.get("project1");
      expect(updated?.project_id).toBe("project1");
    });

    test("replaces overrides when updating", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        overrides: {
          meta_agents: {
            agent1: {
              base_model: "model1",
              delegates_to: ["target1"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "target1",
                },
              ],
            },
          },
        },
      });

      // Act
      registry.update("project1", {
        overrides: {
          meta_agents: {
            agent2: {
              base_model: "model2",
              delegates_to: ["target2"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "target2",
                },
              ],
            },
          },
        },
      });

      // Assert - note: nested objects are replaced, not deep merged
      const updated = registry.get("project1");
      expect(updated?.overrides?.meta_agents?.agent1).toBeUndefined();
      expect(updated?.overrides?.meta_agents?.agent2).toBeDefined();
    });

    test("updates metadata timestamp", () => {
      // Arrange
      registry.register("project1", {
        project_id: "project1",
        metadata: {
          description: "Original",
          created_at: "2024-01-01T00:00:00Z",
        },
      });

      const beforeUpdate = Date.now();

      // Act
      registry.update("project1", {
        metadata: {
          description: "Updated",
        },
      });

      // Assert
      const updated = registry.get("project1");
      expect(updated?.metadata?.description).toBe("Updated");
      expect(updated?.metadata?.created_at).toBe("2024-01-01T00:00:00Z");

      const updatedTime = new Date(updated?.metadata?.updated_at ?? "").getTime();
      expect(updatedTime).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe("getProjectCount", () => {
    test("returns 0 for empty registry", () => {
      // Act & Assert
      expect(registry.getProjectCount()).toBe(0);
    });

    test("returns correct count after registrations", () => {
      // Arrange
      registry.register("project1", { project_id: "project1", analytics_enabled: true });
      registry.register("project2", { project_id: "project2" });
      registry.register("project3", { project_id: "project3" });

      // Act & Assert
      expect(registry.getProjectCount()).toBe(3);
    });

    test("returns correct count after unregister", () => {
      // Arrange
      registry.register("project1", { project_id: "project1", analytics_enabled: true });
      registry.register("project2", { project_id: "project2" });

      // Act
      registry.unregister("project1");

      // Assert
      expect(registry.getProjectCount()).toBe(1);
    });

    test("returns correct count after overwriting registration", () => {
      // Arrange
      registry.register("project1", { project_id: "project1", analytics_enabled: true });
      registry.register("project2", { project_id: "project2" });

      // Act - overwriting project1 doesn't change count
      registry.register("project1", { project_id: "project1", analytics_enabled: true });

      // Assert
      expect(registry.getProjectCount()).toBe(2);
    });
  });
});
