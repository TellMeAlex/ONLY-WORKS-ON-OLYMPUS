import type {
  Matcher,
  RoutingRule,
  KeywordMatcher,
  ComplexityMatcher,
  RegexMatcher,
  ProjectContextMatcher,
  AlwaysMatcher,
} from "./types.js";

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
export function evaluateRoutingRules(
  rules: RoutingRule[],
  context: RoutingContext
): ResolvedRoute | null {
  for (const rule of rules) {
    const matched = evaluateMatcher(rule.matcher, context);

    if (matched) {
      return {
        target_agent: rule.target_agent,
        config_overrides: rule.config_overrides,
      };
    }
  }
  return null;
}

/**
 * Evaluates a single matcher against the routing context
 * Dispatches to specific matcher evaluators based on matcher type
 */
export function evaluateMatcher(
  matcher: Matcher,
  context: RoutingContext
): boolean {
  switch (matcher.type) {
    case "keyword":
      return evaluateKeywordMatcher(matcher, context);
    case "complexity":
      return evaluateComplexityMatcher(matcher, context);
    case "regex":
      return evaluateRegexMatcher(matcher, context);
    case "project_context":
      return evaluateProjectContextMatcher(matcher, context);
    case "always":
      return evaluateAlwaysMatcher(matcher, context);
    default:
      const exhaustive: never = matcher;
      throw new Error(`Unknown matcher type: ${exhaustive}`);
  }
}

function evaluateKeywordMatcher(
  matcher: KeywordMatcher,
  context: RoutingContext
): boolean {
  const prompt = context.prompt.toLowerCase();
  const keywords = matcher.keywords.map((kw) => kw.toLowerCase());

  if (matcher.mode === "any") {
    return keywords.some((kw) => prompt.includes(kw));
  } else {
    return keywords.every((kw) => prompt.includes(kw));
  }
}

function evaluateComplexityMatcher(
  matcher: ComplexityMatcher,
  context: RoutingContext
): boolean {
  const complexity = calculateComplexity(context.prompt);
  const thresholdMap: Record<string, number> = {
    low: 2,
    medium: 5,
    high: 10,
  };
  const threshold = thresholdMap[matcher.threshold] ?? 0;
  return complexity >= threshold;
}

function calculateComplexity(prompt: string): number {
  const lines = prompt.split("\n").length;
  let score = Math.ceil(lines / 10);

  const technicalKeywords = [
    "architecture",
    "performance",
    "optimization",
    "database",
    "async",
    "concurrent",
    "algorithm",
    "data structure",
    "api",
    "integration",
    "security",
    "encryption",
    "authentication",
    "deployment",
    "infrastructure",
    "testing",
    "refactor",
    "debug",
    "trace",
    "profile",
  ];

  const promptLower = prompt.toLowerCase();
  const keywordCount = technicalKeywords.filter((kw) =>
    promptLower.includes(kw)
  ).length;

  score += keywordCount;
  return score;
}

function evaluateRegexMatcher(
  matcher: RegexMatcher,
  context: RoutingContext
): boolean {
  try {
    const regex = new RegExp(matcher.pattern, matcher.flags || "i");
    return regex.test(context.prompt);
  } catch {
    return false;
  }
}

function evaluateProjectContextMatcher(
  matcher: ProjectContextMatcher,
  context: RoutingContext
): boolean {
  if (matcher.has_files && matcher.has_files.length > 0) {
    const filesMatch = matcher.has_files.every((filePath) => {
      return context.projectFiles?.includes(filePath) ?? false;
    });
    if (!filesMatch) {
      return false;
    }
  }

  if (matcher.has_deps && matcher.has_deps.length > 0) {
    const depsMatch = matcher.has_deps.every((dep) => {
      return context.projectDeps?.includes(dep) ?? false;
    });
    if (!depsMatch) {
      return false;
    }
  }

  return true;
}

function evaluateAlwaysMatcher(
  matcher: AlwaysMatcher,
  context: RoutingContext
): boolean {
  return true;
}

/**
 * Gets a human-readable description of what was matched
 */
export function getMatchedContent(
  matcher: Matcher,
  context: RoutingContext
): string {
  switch (matcher.type) {
    case "keyword": {
      const promptLower = context.prompt.toLowerCase();
      const matchedKeywords = matcher.keywords.filter((kw) =>
        promptLower.includes(kw.toLowerCase())
      );
      return `matched keywords: ${matchedKeywords.join(", ")}`;
    }
    case "regex":
      return `matched pattern: /${matcher.pattern}/${matcher.flags || ""}`;
    case "complexity":
      return `complexity score >= ${matcher.threshold}`;
    case "project_context":
      const fileMatches =
        matcher.has_files && matcher.has_files.length > 0
          ? `files: ${matcher.has_files.join(", ")}`
          : "";
      const depMatches =
        matcher.has_deps && matcher.has_deps.length > 0
          ? `deps: ${matcher.has_deps.join(", ")}`
          : "";
      const parts = [fileMatches, depMatches].filter(Boolean);
      return parts.length > 0 ? parts.join("; ") : "project context match";
    case "always":
      return "always match";
    default:
      const exhaustive: never = matcher;
      throw new Error(`Unknown matcher type: ${exhaustive}`);
  }
}
