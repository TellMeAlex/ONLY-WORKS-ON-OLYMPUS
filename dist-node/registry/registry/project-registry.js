/**
 * Registry for managing multiple project configurations with shared settings and overrides
 */
export class ProjectRegistry {
    constructor(config = {}, analyticsStorage) {
        this.projects = new Map();
        this.sharedConfig = null;
        this.portfolioConfig = null;
        this.registryConfig = config;
        this.analyticsStorage = analyticsStorage;
        // Initialize shared config if provided
        if (config.shared_config) {
            this.sharedConfig = config.shared_config;
        }
        // Initialize portfolio config if provided
        if (config.portfolio) {
            this.portfolioConfig = config.portfolio;
        }
        // Register all projects from initial config
        for (const [projectId, projectConfig] of Object.entries(config.projects || {})) {
            this.register(projectId, projectConfig);
        }
    }
    /**
     * Register a project configuration
     */
    register(projectId, config) {
        // Ensure project_id matches the key
        const normalizedConfig = {
            ...config,
            project_id: projectId,
        };
        this.projects.set(projectId, normalizedConfig);
    }
    /**
     * Get a project configuration by ID
     * Returns null if project not found
     */
    get(projectId) {
        return this.projects.get(projectId) ?? null;
    }
    /**
     * Get all registered project configurations
     */
    getAll() {
        const result = {};
        for (const [projectId, config] of this.projects.entries()) {
            result[projectId] = config;
        }
        return result;
    }
    /**
     * Check if a project is registered
     */
    has(projectId) {
        return this.projects.has(projectId);
    }
    /**
     * Unregister a project
     */
    unregister(projectId) {
        return this.projects.delete(projectId);
    }
    /**
     * Get merged configuration for a project
     * Merges shared config with project-specific overrides
     */
    getMergedConfig(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            return null;
        }
        // Start with base config from shared config (if any)
        const baseConfig = this.sharedConfig?.base_config ?? {};
        // Merge project-specific overrides
        const merged = {
            ...baseConfig,
        };
        // Apply project overrides if they exist
        if (project.overrides) {
            // Merge meta_agents
            if (project.overrides.meta_agents) {
                merged.meta_agents = {
                    ...merged.meta_agents,
                    ...project.overrides.meta_agents,
                };
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
                };
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
    getSharedConfig() {
        return this.sharedConfig;
    }
    /**
     * Set the shared configuration
     */
    setSharedConfig(config) {
        this.sharedConfig = config;
    }
    /**
     * Get the portfolio configuration
     */
    getPortfolioConfig() {
        return this.portfolioConfig;
    }
    /**
     * Set the portfolio configuration
     */
    setPortfolioConfig(config) {
        this.portfolioConfig = config;
    }
    /**
     * Get the default project ID from portfolio config
     */
    getDefaultProjectId() {
        return this.portfolioConfig?.default_project_id ?? null;
    }
    /**
     * Check if cross-project delegation is enabled
     */
    isCrossProjectDelegationEnabled() {
        return this.portfolioConfig?.enable_cross_project_delegation ?? true;
    }
    /**
     * Check if analytics aggregation is enabled
     */
    isAggregationEnabled() {
        return this.portfolioConfig?.enable_aggregation ?? true;
    }
    /**
     * Get the maximum cross-project delegation depth
     */
    getMaxCrossProjectDepth() {
        return this.portfolioConfig?.max_cross_project_depth ?? 5;
    }
    /**
     * Get the agent namespace format
     */
    getAgentNamespaceFormat() {
        return this.portfolioConfig?.agent_namespace_format ?? "{project_id}:{agent_name}";
    }
    /**
     * Format an agent name with project namespace
     */
    formatAgentName(projectId, agentName) {
        const format = this.getAgentNamespaceFormat();
        return format
            .replace("{project_id}", projectId)
            .replace("{agent_name}", agentName);
    }
    /**
     * Parse a namespaced agent name
     * Returns { projectId, agentName } or null if not a valid namespaced name
     */
    parseAgentName(namespacedName) {
        const format = this.getAgentNamespaceFormat();
        const projectIdVar = "{project_id}";
        const agentNameVar = "{agent_name}";
        // Check if the format matches the pattern
        const parts = namespacedName.split(":");
        // Simple case: "project:agent"
        if (format === "{project_id}:{agent_name}" && parts.length === 2) {
            return { projectId: parts[0], agentName: parts[1] };
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
    getAnalyticsEnabledProjects() {
        const result = [];
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
    getProjectMetadata(projectId) {
        const project = this.projects.get(projectId);
        return project?.metadata ?? null;
    }
    /**
     * Get projects by tag
     */
    getProjectsByTag(tag) {
        const result = [];
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
    update(projectId, updates) {
        const existing = this.projects.get(projectId);
        if (!existing) {
            return false;
        }
        const updated = {
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
    getProjectCount() {
        return this.projects.size;
    }
}
