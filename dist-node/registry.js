import { createMetaAgentConfig } from "./meta-agent.js";
import { RoutingLogger } from "./logger.js";
class MetaAgentRegistry {
  definitions = /* @__PURE__ */ new Map();
  delegations = {};
  maxDepth;
  logger;
  analyticsStorage;
  projectRegistry;
  constructor(maxDepth = 3, loggerConfig, analyticsStorage, projectRegistry) {
    this.maxDepth = maxDepth;
    this.analyticsStorage = analyticsStorage;
    this.projectRegistry = projectRegistry;
    if (loggerConfig) {
      this.logger = new RoutingLogger(loggerConfig);
    }
  }
  /**
   * Format an agent name with project namespace
   * Uses ProjectRegistry's format if available, otherwise defaults to "project:agent"
   */
  formatAgentName(projectId, agentName) {
    if (this.projectRegistry) {
      return this.projectRegistry.formatAgentName(projectId, agentName);
    }
    return `${projectId}:${agentName}`;
  }
  /**
   * Parse a namespaced agent name
   * Returns { projectId, agentName } or null if not a valid namespaced name
   */
  parseAgentName(namespacedName) {
    if (this.projectRegistry) {
      return this.projectRegistry.parseAgentName(namespacedName);
    }
    const parts = namespacedName.split(":");
    if (parts.length === 2) {
      return { projectId: parts[0] ?? "", agentName: parts[1] ?? "" };
    }
    return null;
  }
  /**
   * Check if a name is a namespaced agent name
   */
  isNamespacedName(name) {
    return name.includes(":");
  }
  /**
   * Check if cross-project delegation is enabled
   */
  isCrossProjectDelegationEnabled() {
    return this.projectRegistry?.isCrossProjectDelegationEnabled() ?? false;
  }
  /**
   * Get the maximum cross-project delegation depth
   */
  getMaxCrossProjectDepth() {
    return this.projectRegistry?.getMaxCrossProjectDepth() ?? this.maxDepth;
  }
  /**
   * Register a meta-agent definition
   */
  register(name, def) {
    this.definitions.set(name, def);
  }
  /**
   * Get all registered meta-agent definitions
   */
  getAll() {
    const result = {};
    for (const [name, def] of this.definitions.entries()) {
      result[name] = def;
    }
    return result;
  }
  /**
   * Resolve a meta-agent to its AgentConfig by evaluating routing rules
   * Returns null if no route matches
   */
  resolve(name, context) {
    const def = this.definitions.get(name);
    if (!def) {
      throw new Error(`Meta-agent "${name}" not registered`);
    }
    return createMetaAgentConfig(def, context, name, this.logger);
  }
  /**
   * Track a delegation from one agent to another
   * Used for circular dependency detection
   * Supports both local and cross-project agent delegation with namespacing
   */
  trackDelegation(from, to) {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }
  /**
   * Check if a delegation would create a circular dependency
   * Returns true if circular, false if safe
   */
  checkCircular(from, to, maxDepth) {
    const effectiveMaxDepth = maxDepth ?? this.maxDepth;
    const fromProjectId = this.parseAgentName(from)?.projectId;
    const toProjectId = this.parseAgentName(to)?.projectId;
    const isCrossProject = fromProjectId && toProjectId && fromProjectId !== toProjectId;
    if (isCrossProject && this.isCrossProjectDelegationEnabled()) {
      return this.hasCircle(from, to, this.getMaxCrossProjectDepth(), /* @__PURE__ */ new Set());
    }
    return this.hasCircle(from, to, effectiveMaxDepth, /* @__PURE__ */ new Set());
  }
  /**
   * Recursively check for circular paths in delegation chain
   * @param current - Current agent in the chain (may be namespaced)
   * @param target - Target agent we're trying to reach (may be namespaced)
   * @param depth - Remaining depth to search
   * @param visited - Set of visited nodes to detect cycles
   * @returns true if a circular path exists, false otherwise
   */
  hasCircle(current, target, depth, visited) {
    if (depth <= 0) {
      return false;
    }
    if (visited.has(current)) {
      return true;
    }
    if (current === target) {
      return true;
    }
    visited.add(current);
    for (const [delegation, _count] of Object.entries(this.delegations)) {
      const [from, next] = delegation.split(":");
      if (from === current && next) {
        if (this.hasCircle(next, target, depth - 1, new Set(visited))) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Get current delegation depth (longest chain tracked)
   */
  getMaxTrackedDepth() {
    let maxDepth = 0;
    for (const delegation of Object.keys(this.delegations)) {
      const parts = delegation.split(":");
      if (parts.length === 2) {
        let depth = 1;
        let current = parts[1];
        while (true) {
          let found = false;
          for (const next of Object.keys(this.delegations)) {
            const [from, to] = next.split(":");
            if (from === current) {
              depth++;
              current = to;
              found = true;
              break;
            }
          }
          if (!found) break;
        }
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }
}
export {
  MetaAgentRegistry
};
