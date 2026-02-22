import type { MetaAgentDef, RoutingLoggerConfig } from "../config/schema.js";
import type { RoutingContext } from "./routing.js";
import { createMetaAgentConfig } from "./meta-agent.js";
import { RoutingLogger } from "./logger.js";
import type { AgentConfig } from "@opencode-ai/sdk";
import type { AnalyticsStorage } from "../analytics/storage.js";

/**
 * Tracks delegation chains to detect circular dependencies
 * Key: "from:to", Value: depth level
 *
 * @since 0.1.0
 * @internal
 * Internal implementation detail of the registry system.
 */
interface DelegationTracker {
  [key: string]: number;
}

/**
 * Registry for meta-agents with delegation tracking and circular dependency detection.
 *
 * @since 0.1.0
 * @stable
 *
 * Manages meta-agent definitions and tracks delegation relationships to prevent
 * circular dependencies. Provides methods for registering, resolving, and
 * tracking meta-agent delegations.
 *
 * @example
 * ```ts
 * const registry = new MetaAgentRegistry(3, loggerConfig);
 * registry.register("my-agent", metaAgentDef);
 * const agentConfig = registry.resolve("my-agent", routingContext);
 * ```
 */
export class MetaAgentRegistry {
  private definitions: Map<string, MetaAgentDef> = new Map();
  private delegations: DelegationTracker = {};
  private maxDepth: number;
  private logger?: RoutingLogger;
  private analyticsStorage?: AnalyticsStorage;

  /**
   * Creates a new MetaAgentRegistry instance.
   *
   * @since 0.1.0
   * @stable
   *
   * @param maxDepth - Maximum delegation depth to prevent infinite chains (default: 3)
   * @param loggerConfig - Optional configuration for routing logger
   * @param analyticsStorage - Optional analytics storage for tracking routing decisions
   */
  constructor(
    maxDepth: number = 3,
    loggerConfig?: RoutingLoggerConfig,
    analyticsStorage?: AnalyticsStorage,
  ) {
    this.maxDepth = maxDepth;
    this.analyticsStorage = analyticsStorage;
    if (loggerConfig) {
      this.logger = new RoutingLogger(loggerConfig);
    }
  }

  /**
   * Register a meta-agent definition.
   *
   * @since 0.1.0
   * @stable
   *
   * @param name - Unique identifier for the meta-agent
   * @param def - Meta-agent definition containing routing rules and configuration
   */
  register(name: string, def: MetaAgentDef): void {
    this.definitions.set(name, def);
  }

  /**
   * Get all registered meta-agent definitions.
   *
   * @since 0.1.0
   * @stable
   *
   * @returns Object mapping agent names to their definitions
   */
  getAll(): Record<string, MetaAgentDef> {
    const result: Record<string, MetaAgentDef> = {};
    for (const [name, def] of this.definitions.entries()) {
      result[name] = def;
    }
    return result;
  }

  /**
   * Resolve a meta-agent to its AgentConfig by evaluating routing rules.
   *
   * @since 0.1.0
   * @stable
   *
   * Evaluates the meta-agent's routing rules against the provided context
   * to determine which sub-agent to use. Returns null if no route matches.
   *
   * @param name - Name of the meta-agent to resolve
   * @param context - Routing context containing task information
   * @returns AgentConfig if a route matches, null otherwise
   * @throws Error if the meta-agent is not registered
   */
  resolve(name: string, context: RoutingContext): AgentConfig | null {
    const def = this.definitions.get(name);
    if (!def) {
      throw new Error(`Meta-agent "${name}" not registered`);
    }

    return createMetaAgentConfig(def, context, name, this.logger);
  }

  /**
   * Track a delegation from one agent to another.
   *
   * @since 0.1.0
   * @stable
   *
   * Records the delegation relationship for circular dependency detection.
   * Used by the routing system to track which agents delegate to which.
   *
   * @param from - Source agent that is delegating
   * @param to - Target agent being delegated to
   */
  trackDelegation(from: string, to: string): void {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }

  /**
   * Check if a delegation would create a circular dependency.
   *
   * @since 0.1.0
   * @stable
   *
   * Performs recursive depth-limited search to detect circular delegation
   * chains that could cause infinite loops during agent execution.
   *
   * @param from - Source agent that would delegate
   * @param to - Target agent to check for circular path
   * @param maxDepth - Maximum depth to search (defaults to instance maxDepth)
   * @returns true if a circular dependency would be created, false otherwise
   */
  checkCircular(
    from: string,
    to: string,
    maxDepth: number = this.maxDepth,
  ): boolean {
    return this.hasCircle(from, to, maxDepth, new Set());
  }

  /**
   * Recursively check for circular paths in delegation chain
   * @param current - Current agent in the chain
   * @param target - Target agent we're trying to reach
   * @param depth - Remaining depth to search
   * @param visited - Set of visited nodes to detect cycles
   * @returns true if a circular path exists, false otherwise
   */
  private hasCircle(
    current: string,
    target: string,
    depth: number,
    visited: Set<string>,
  ): boolean {
    if (depth <= 0) {
      return false;
    }

    if (visited.has(current)) {
      // Already visited this node in this path - potential cycle
      return true;
    }

    if (current === target) {
      // Direct connection found
      return true;
    }

    visited.add(current);

    // Check all known delegations from current agent
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
   * Get current delegation depth (longest chain tracked).
   *
   * @since 0.1.0
   * @stable
   *
   * Analyzes all tracked delegations to find the longest delegation chain.
   * Useful for monitoring and debugging complex routing scenarios.
   *
   * @returns The maximum depth of any tracked delegation chain
   */
  getMaxTrackedDepth(): number {
    let maxDepth = 0;

    for (const delegation of Object.keys(this.delegations)) {
      const parts = delegation.split(":");
      if (parts.length === 2) {
        // Count how many hops from this starting point
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
