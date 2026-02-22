import type {
  ProjectConfig,
  ProjectRegistryConfig,
  SharedConfig,
  PortfolioConfig,
  OlimpusConfig,
} from "../config/schema.js";
import type { AnalyticsStorage } from "../analytics/storage.js";

/**
 * Registry for managing multiple project configurations with shared settings and overrides
 */
export class ProjectRegistry {
  private projects: Map<string, ProjectConfig> = new Map();
  private sharedConfig: SharedConfig | null = null;
  private portfolioConfig: PortfolioConfig | null = null;
  private registryConfig: ProjectRegistryConfig;
  private analyticsStorage?: AnalyticsStorage;

  constructor(
    config?: ProjectRegistryConfig,
    analyticsStorage?: AnalyticsStorage,
  ) {
    this.registryConfig = config ?? { projects: {} };
    this.analyticsStorage = analyticsStorage;

    // Initialize shared config if provided
    if (this.registryConfig.shared_config) {
      this.sharedConfig = this.registryConfig.shared_config;
    }
    // Initialize portfolio config if provided
    if (this.registryConfig.portfolio) {
      this.portfolioConfig = this.registryConfig.portfolio;
    }
    // Register all projects from initial config
    for (const [projectId, projectConfig] of Object.entries(this.registryConfig.projects || {})) {
      this.register(projectId, projectConfig);
    }
  }

  /**
   * Register a project configuration
   */
  register(projectId: string, config: ProjectConfig): void {
    // Ensure project_id matches the key
    const normalizedConfig: ProjectConfig = {
      ...config,
      project_id: projectId,
    };
    this.projects.set(projectId, normalizedConfig);
  }

  /**
   * Get a project configuration by ID
   * Returns null if project not found
   */
  get(projectId: string): ProjectConfig | null {
    return this.projects.get(projectId) ?? null;
  }

  /**
   * Get all registered project configurations
   */
  getAll(): Record<string, ProjectConfig> {
    const result: Record<string, ProjectConfig> = {};
    for (const [projectId, config] of this.projects.entries()) {
      result[projectId] = config;
    }
    return result;
  }

  /**
   * Check if a project is registered
   */
  has(projectId: string): boolean {
    return this.projects.has(projectId);
  }

  /**
   * Unregister a project
   */
  unregister(projectId: string): boolean {
    return this.projects.delete(projectId);
  }

  /**
   * Get merged configuration for a project
   * Merges shared config with project-specific overrides
   */
  getMergedConfig(projectId: string): OlimpusConfig | null {
    const project = this.projects.get(projectId);
    if (!project) {
      return null;
    }

    // Start with base config from shared config (if any)
    const baseConfig = this.sharedConfig?.base_config ?? {};

    // Merge project-specific overrides
    const merged: OlimpusConfig = {
      ...baseConfig,
    };

    // Apply project overrides if they exist
    if (project.overrides) {
      // Merge meta_agents (partial overrides)
      if (project.overrides.meta_agents) {
        merged.meta_agents = {
          ...merged.meta_agents,
          ...project.overrides.meta_agents,
        } as typeof merged.meta_agents;
      }

      // Merge providers config
      if (project.overrides.providers) {
        merged.providers = {
          ...merged.providers,
          ...project.overrides.providers,
        };
      }

      // Merge settings
      if (project.overrides.settings) {
        merged.settings = {
          ...merged.settings,
          ...project.overrides.settings,
        } as typeof merged.settings;
      }

      // Merge agent overrides
      if (project.overrides.agents) {
        merged.agents = {
          ...merged.agents,
          ...project.overrides.agents,
        };
      }

      // Merge categories
      if (project.overrides.categories) {
        merged.categories = {
          ...merged.categories,
          ...project.overrides.categories,
        };
      }

      // Merge skills
      if (project.overrides.skills) {
        merged.skills = [
          ...(merged.skills ?? []),
          ...project.overrides.skills,
        ];
      }
    }

    return merged;
  }

  /**
   * Get the shared configuration
   */
  getSharedConfig(): SharedConfig | null {
    return this.sharedConfig;
  }

  /**
   * Set the shared configuration
   */
  setSharedConfig(config: SharedConfig): void {
    this.sharedConfig = config;
  }

  /**
   * Get the portfolio configuration
   */
  getPortfolioConfig(): PortfolioConfig | null {
    return this.portfolioConfig;
  }

  /**
   * Set the portfolio configuration
   */
  setPortfolioConfig(config: PortfolioConfig): void {
    this.portfolioConfig = config;
  }

  /**
   * Get the default project ID from portfolio config
   */
  getDefaultProjectId(): string | null {
    return this.portfolioConfig?.default_project_id ?? null;
  }

  /**
   * Check if cross-project delegation is enabled
   */
  isCrossProjectDelegationEnabled(): boolean {
    return this.portfolioConfig?.enable_cross_project_delegation ?? true;
  }

  /**
   * Check if analytics aggregation is enabled
   */
  isAggregationEnabled(): boolean {
    return this.portfolioConfig?.enable_aggregation ?? true;
  }

  /**
   * Get the maximum cross-project delegation depth
   */
  getMaxCrossProjectDepth(): number {
    return this.portfolioConfig?.max_cross_project_depth ?? 5;
  }

  /**
   * Get the agent namespace format
   */
  getAgentNamespaceFormat(): string {
    return this.portfolioConfig?.agent_namespace_format ?? "{project_id}:{agent_name}";
  }

  /**
   * Format an agent name with project namespace
   */
  formatAgentName(projectId: string, agentName: string): string {
    const format = this.getAgentNamespaceFormat();
    return format
      .replace("{project_id}", projectId)
      .replace("{agent_name}", agentName);
  }

  /**
   * Parse a namespaced agent name
   * Returns { projectId, agentName } or null if not a valid namespaced name
   */
  parseAgentName(namespacedName: string): { projectId: string; agentName: string } | null {
    const format = this.getAgentNamespaceFormat();
    const projectIdVar = "{project_id}";
    const agentNameVar = "{agent_name}";

    // Check if the format matches the pattern
    const parts = namespacedName.split(":");

    // Simple case: "project:agent"
    if (format === "{project_id}:{agent_name}" && parts.length === 2) {
      return { projectId: parts[0] ?? "", agentName: parts[1] ?? "" };
    }

    // For other formats, try to infer based on registered projects
    for (const [projectId] of this.projects.entries()) {
      const prefix = format.replace(projectIdVar, projectId).replace(agentNameVar, "");
      if (namespacedName.startsWith(prefix)) {
        const agentName = namespacedName.slice(prefix.length);
        return { projectId, agentName };
      }
    }

    return null;
  }

  /**
   * Get all projects with analytics enabled
   */
  getAnalyticsEnabledProjects(): ProjectConfig[] {
    const result: ProjectConfig[] = [];
    for (const config of this.projects.values()) {
      if (config.analytics_enabled) {
        result.push(config);
      }
    }
    return result;
  }

  /**
   * Get project metadata
   */
  getProjectMetadata(projectId: string): ProjectConfig["metadata"] | null {
    const project = this.projects.get(projectId);
    return project?.metadata ?? null;
  }

  /**
   * Get projects by tag
   */
  getProjectsByTag(tag: string): ProjectConfig[] {
    const result: ProjectConfig[] = [];
    for (const config of this.projects.values()) {
      if (config.metadata?.tags?.includes(tag)) {
        result.push(config);
      }
    }
    return result;
  }

  /**
   * Update a project configuration
   */
  update(projectId: string, updates: Partial<ProjectConfig>): boolean {
    const existing = this.projects.get(projectId);
    if (!existing) {
      return false;
    }

    const updated: ProjectConfig = {
      ...existing,
      ...updates,
      project_id: projectId, // Ensure project_id is preserved
      overrides: {
        ...existing.overrides,
        ...(updates.overrides ?? {}),
      },
      metadata: {
        ...existing.metadata,
        ...(updates.metadata ?? {}),
        updated_at: new Date().toISOString(),
      },
    };

    this.projects.set(projectId, updated);
    return true;
  }

  /**
   * Get the count of registered projects
   */
  getProjectCount(): number {
    return this.projects.size;
  }
}
