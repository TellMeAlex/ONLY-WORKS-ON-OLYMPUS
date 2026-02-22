import type { Matcher, RoutingRule } from "./types.js";
/**
 * Routing context for browser-based matcher evaluation
 * Simplified version without file system access
 */
export interface RoutingContext {
    prompt: string;
    projectFiles?: string[];
    projectDeps?: string[];
}
export interface ResolvedRoute {
    target_agent: string;
    config_overrides?: {
        model?: string;
        temperature?: number;
        prompt?: string;
        variant?: string;
    };
}
/**
 * Evaluates routing rules in order and returns the first matching route
 * Returns null if no rules match
 */
export declare function evaluateRoutingRules(rules: RoutingRule[], context: RoutingContext): ResolvedRoute | null;
/**
 * Evaluates a single matcher against the routing context
 * Dispatches to specific matcher evaluators based on matcher type
 */
export declare function evaluateMatcher(matcher: Matcher, context: RoutingContext): boolean;
/**
 * Gets a human-readable description of what was matched
 */
export declare function getMatchedContent(matcher: Matcher, context: RoutingContext): string;
//# sourceMappingURL=matcher-evaluator.d.ts.map