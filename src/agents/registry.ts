import type { MetaAgentDef, RoutingLoggerConfig } from "../config/schema.js";
import type { RoutingContext } from "./routing.js";
import { createMetaAgentConfig } from "./meta-agent.js";
import { RoutingLogger } from "./logger.js";
import type { AgentConfig } from "./meta-agent.js";
import type { AnalyticsStorage } from "../analytics/storage.js";

/**
 * Tracks delegation chains to detect circular dependencies
 * Key: "from:to", Value: depth level
 */
interface DelegationTracker {
  [key: string]: number;
}

/**
 * Registry for meta-agents with delegation tracking and circular dependency detection
 */
export class MetaAgentRegistry {
  private definitions: Map<string, MetaAgentDef> = new Map();
  private delegations: DelegationTracker = {};
  private maxDepth: number;
  private logger?: RoutingLogger;
  private analyticsStorage?: AnalyticsStorage;

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
   * Register a meta-agent definition
   */
  register(name: string, def: MetaAgentDef): void {
    this.definitions.set(name, def);
  }

  /**
   * Get all registered meta-agent definitions
   */
  getAll(): Record<string, MetaAgentDef> {
    const result: Record<string, MetaAgentDef> = {};
    for (const [name, def] of this.definitions.entries()) {
      result[name] = def;
    }
    return result;
  }

  /**
   * Resolve a meta-agent to its AgentConfig by evaluating routing rules
   * Returns null if no route matches
   */
  resolve(name: string, context: RoutingContext): AgentConfig | null {
    const def = this.definitions.get(name);
    if (!def) {
      throw new Error(`Meta-agent "${name}" not registered`);
    }

    return createMetaAgentConfig(def, context, name, this.logger);
  }

  /**
   * Track a delegation from one agent to another
   * Used for circular dependency detection
   */
  trackDelegation(from: string, to: string): void {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }

  /**
   * Check if a delegation would create a circular dependency
   * Returns true if circular, false if safe
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
   * Get current delegation depth (longest chain tracked)
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
