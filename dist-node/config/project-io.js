// src/config/project-io.ts
import * as fs from "fs";
import * as path from "path";

// src/config/schema.ts
import { z } from "zod";
var KeywordMatcherSchema = z.object({
  type: z.literal("keyword"),
  keywords: z.array(z.string()).min(1),
  mode: z.enum(["any", "all"])
});
var ComplexityMatcherSchema = z.object({
  type: z.literal("complexity"),
  threshold: z.enum(["low", "medium", "high"])
});
var RegexMatcherSchema = z.object({
  type: z.literal("regex"),
  pattern: z.string().min(1),
  flags: z.string().optional()
});
var ProjectContextMatcherSchema = z.object({
  type: z.literal("project_context"),
  has_files: z.array(z.string()).optional(),
  has_deps: z.array(z.string()).optional()
});
var AlwaysMatcherSchema = z.object({
  type: z.literal("always")
});
var MatcherSchema = z.discriminatedUnion("type", [
  KeywordMatcherSchema,
  ComplexityMatcherSchema,
  RegexMatcherSchema,
  ProjectContextMatcherSchema,
  AlwaysMatcherSchema
]);
var RoutingRuleSchema = z.object({
  matcher: MatcherSchema,
  target_agent: z.string(),
  config_overrides: z.object({
    model: z.string().optional(),
    temperature: z.number().optional(),
    prompt: z.string().optional(),
    variant: z.string().optional()
  }).optional()
});
var MetaAgentSchema = z.object({
  base_model: z.string(),
  delegates_to: z.array(z.string()).min(1),
  routing_rules: z.array(RoutingRuleSchema).min(1),
  prompt_template: z.string().optional(),
  temperature: z.number().optional()
});
var AgentOverrideSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  prompt: z.string().optional(),
  skills: z.array(z.string()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional()
});
var AgentOverridesSchema = z.record(z.string(), AgentOverrideSchema).optional();
var CategoryConfigSchema = z.object({
  description: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional()
});
var CategoriesSchema = z.record(z.string(), CategoryConfigSchema).optional();
var ProviderConfigSchema = z.object({
  priority_chain: z.array(z.string()).optional(),
  research_providers: z.array(z.string()).optional(),
  strategy_providers: z.array(z.string()).optional(),
  config: z.record(
    z.string(),
    z.record(z.string(), z.string().or(z.boolean()).or(z.number())).optional()
  ).optional()
});
var RoutingAnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  storage_file: z.string().default("analytics.json"),
  max_events: z.number().int().positive().default(1e4),
  retention_days: z.number().int().positive().default(90),
  auto_prune: z.boolean().default(true)
});
var RoutingLoggerConfigSchema = z.object({
  enabled: z.boolean().optional(),
  output: z.enum(["console", "file", "disabled"]).optional(),
  log_file: z.string().optional(),
  debug_mode: z.boolean().optional(),
  analytics_config: RoutingAnalyticsConfigSchema.optional()
});
var AnalyticsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  storage: z.object({
    type: z.enum(["memory", "file", "database"]).optional(),
    path: z.string().optional(),
    retention_days: z.number().int().positive().optional()
  }).optional(),
  metrics: z.object({
    track_routing_decisions: z.boolean().optional(),
    track_execution_time: z.boolean().optional(),
    track_agent_usage: z.boolean().optional(),
    track_model_costs: z.boolean().optional(),
    track_success_rates: z.boolean().optional()
  }).optional(),
  aggregation: z.object({
    enabled: z.boolean().optional(),
    window_minutes: z.number().int().positive().optional(),
    include_percentiles: z.boolean().optional()
  }).optional()
});
var SettingsSchema = z.object({
  namespace_prefix: z.string().default("olimpus"),
  max_delegation_depth: z.number().int().positive().default(3),
  // Background parallelization
  background_parallelization: z.object({
    enabled: z.boolean().optional(),
    max_parallel_tasks: z.number().int().positive().optional(),
    timeout_ms: z.number().int().positive().optional()
  }).optional(),
  // Adaptive model selection
  adaptive_model_selection: z.object({
    enabled: z.boolean().optional(),
    research_model: z.string().optional(),
    strategy_model: z.string().optional(),
    default_model: z.string().optional()
  }).optional(),
  // Ultrawork and relentless execution
  ultrawork_enabled: z.boolean().optional(),
  todo_continuation: z.boolean().optional(),
  verify_before_completion: z.boolean().optional(),
  // Code quality
  lsp_refactoring_preferred: z.boolean().optional(),
  aggressive_comment_pruning: z.boolean().optional(),
  // Routing logger
  routing_logger: RoutingLoggerConfigSchema.optional(),
  // Analytics
  analytics: AnalyticsConfigSchema.optional()
});
var OlimpusConfigSchema = z.object({
  // Olimpus-specific sections
  meta_agents: z.record(z.string(), MetaAgentSchema).optional(),
  providers: ProviderConfigSchema.optional(),
  settings: SettingsSchema.optional(),
  skills: z.array(z.string()).optional(),
  // oh-my-opencode passthrough sections
  agents: AgentOverridesSchema,
  categories: CategoriesSchema,
  disabled_hooks: z.array(z.string()).optional()
});
var ProjectOverrideSchema = z.object({
  // Meta-agent overrides
  meta_agents: z.record(z.string(), MetaAgentSchema.partial()).optional(),
  providers: ProviderConfigSchema.partial().optional(),
  settings: SettingsSchema.partial().optional(),
  agents: AgentOverridesSchema.optional(),
  categories: CategoriesSchema.optional(),
  skills: z.array(z.string()).optional()
});
var ProjectConfigSchema = z.object({
  // Unique project identifier
  project_id: z.string().min(1),
  name: z.string().optional(),
  path: z.string().optional(),
  overrides: ProjectOverrideSchema.optional(),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
  }).optional(),
  // Analytics configuration for this project
  analytics_enabled: z.boolean().default(true)
});
var SharedConfigSchema = z.object({
  // Base configuration that all projects inherit
  base_config: OlimpusConfigSchema.optional(),
  default_project: ProjectConfigSchema.partial().optional(),
  global_routing_rules: z.array(RoutingRuleSchema).optional(),
  shared_meta_agents: z.record(z.string(), MetaAgentSchema).optional()
});
var PortfolioConfigSchema = z.object({
  // Enable cross-project analytics aggregation
  enable_aggregation: z.boolean().default(true),
  enable_cross_project_delegation: z.boolean().default(true),
  agent_namespace_format: z.string().default("{project_id}:{agent_name}"),
  default_project_id: z.string().optional(),
  max_cross_project_depth: z.number().int().positive().default(5),
  aggregation_settings: z.object({
    // Minimum confidence threshold for portfolio-wide metrics
    min_confidence_threshold: z.number().min(0).max(1).default(0.8),
    aggregation_window_days: z.number().int().positive().default(30),
    include_project_anonymization: z.boolean().default(true)
  }).optional()
});
var ProjectRegistryConfigSchema = z.object({
  // Portfolio-wide settings
  portfolio: PortfolioConfigSchema.optional(),
  shared_config: SharedConfigSchema.optional(),
  projects: z.record(z.string(), ProjectConfigSchema).default({}),
  registry: z.object({
    // Registry version
    version: z.string().default("1.0.0"),
    registry_id: z.string().optional(),
    created_at: z.string().optional(),
    // Timestamp when registry was last updated
    updated_at: z.string().optional()
  }).optional()
});

// src/config/validator.ts
import { z as z2 } from "zod";
var CircularDependencyErrorSchema = z2.object({
  type: z2.literal("circular_dependency"),
  message: z2.string(),
  path: z2.array(z2.string()),
  meta_agents: z2.array(z2.string())
});
var InvalidAgentReferenceErrorSchema = z2.object({
  type: z2.literal("invalid_agent_reference"),
  message: z2.string(),
  path: z2.array(z2.string()),
  reference: z2.string()
});
var SchemaValidationErrorSchema = z2.object({
  type: z2.literal("schema_validation"),
  message: z2.string(),
  path: z2.array(z2.string()),
  zodIssue: z2.any().optional()
});
var RegexPerformanceWarningSchema = z2.object({
  type: z2.literal("regex_performance"),
  message: z2.string(),
  path: z2.array(z2.string()),
  pattern: z2.string(),
  reason: z2.string()
});
var ValidationErrorSchema = z2.discriminatedUnion("type", [
  CircularDependencyErrorSchema,
  InvalidAgentReferenceErrorSchema,
  SchemaValidationErrorSchema
]);
var ValidationWarningSchema = z2.discriminatedUnion("type", [
  RegexPerformanceWarningSchema
]);
var ValidationResultSchema = z2.object({
  valid: z2.boolean(),
  errors: z2.array(ValidationErrorSchema).default([]),
  warnings: z2.array(ValidationWarningSchema).default([]),
  config: z2.any().optional()
});
var SeveritySchema = z2.enum(["error", "warning"]);
var CheckTypeSchema = z2.enum([
  "schema",
  "circular_dependency",
  "agent_reference",
  "regex_performance"
]);
var CheckResultSchema = z2.object({
  checkType: CheckTypeSchema,
  passed: z2.boolean(),
  errors: z2.array(ValidationErrorSchema).default([]),
  warnings: z2.array(ValidationWarningSchema).default([])
});
var ValidationContextSchema = z2.object({
  configPath: z2.string().optional(),
  configName: z2.string().optional(),
  checkCircularDependencies: z2.boolean().default(true),
  checkAgentReferences: z2.boolean().default(true),
  checkRegexPerformance: z2.boolean().default(true)
});
function createCircularDependencyError(message, path2, metaAgents) {
  return {
    type: "circular_dependency",
    message,
    path: path2,
    meta_agents: metaAgents
  };
}
function createInvalidAgentReferenceError(message, path2, reference) {
  return {
    type: "invalid_agent_reference",
    message,
    path: path2,
    reference
  };
}
function createRegexPerformanceWarning(message, path2, pattern, reason) {
  return {
    type: "regex_performance",
    message,
    path: path2,
    pattern,
    reason
  };
}
function createValidationResult(config) {
  return {
    valid: false,
    errors: [],
    warnings: [],
    config
  };
}
function createCheckResult(checkType, passed = false) {
  return {
    checkType,
    passed,
    errors: [],
    warnings: []
  };
}
function formatErrors(result) {
  return result.errors.map((error) => {
    const pathStr = error.path.length > 0 ? error.path.join(".") : "root";
    return `[ERROR] ${pathStr}: ${error.message}`;
  });
}
function formatWarnings(result) {
  return result.warnings.map((warning) => {
    const pathStr = warning.path.length > 0 ? warning.path.join(".") : "root";
    return `[WARNING] ${pathStr}: ${warning.message}`;
  });
}
function validateOlimpusConfig(config, context) {
  const ctx = {
    checkCircularDependencies: true,
    checkAgentReferences: true,
    checkRegexPerformance: true,
    ...context
  };
  const result = createValidationResult(config);
  if (ctx.checkCircularDependencies) {
    const circularCheck = checkCircularDependenciesInConfig(config, ctx);
    result.errors.push(...circularCheck.errors);
  }
  if (ctx.checkAgentReferences) {
    const agentRefCheck = checkAgentReferencesInConfig(config, ctx);
    result.errors.push(...agentRefCheck.errors);
  }
  if (ctx.checkRegexPerformance) {
    const regexCheck = checkRegexPerformanceInConfig(config, ctx);
    result.warnings.push(...regexCheck.warnings);
  }
  result.valid = result.errors.length === 0;
  return result;
}
var BUILTIN_AGENT_NAMES = [
  "sisyphus",
  "hephaestus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
  "prometheus"
];
var DelegationGraph = class {
  delegations = {};
  maxDepth;
  constructor(maxDepth = 3) {
    this.maxDepth = maxDepth;
  }
  /**
   * Track a delegation from one agent to another
   * Used for circular dependency detection
   */
  trackDelegation(from, to) {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }
  /**
   * Check if a delegation would create a circular dependency
   * Returns true if circular, false if safe
   */
  checkCircular(from, to, maxDepth = this.maxDepth) {
    return this.hasCircle(from, to, maxDepth, /* @__PURE__ */ new Set());
  }
  /**
   * Recursively check for circular paths in delegation chain
   * @param current - Current agent in the chain
   * @param target - Target agent we're trying to reach
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
    for (const delegation of Object.keys(this.delegations)) {
      const [from, next] = delegation.split(":");
      if (from === current && next) {
        if (this.hasCircle(next, target, depth - 1, new Set(visited))) {
          return true;
        }
      }
    }
    return false;
  }
};
function checkCircularDependencies(metaAgents, maxDepth = 3) {
  const errors = [];
  if (Object.keys(metaAgents).length === 0) {
    return errors;
  }
  const graph = new DelegationGraph(maxDepth);
  for (const [name, def] of Object.entries(metaAgents)) {
    for (const delegate of def.delegates_to) {
      graph.trackDelegation(name, delegate);
    }
    for (const rule of def.routing_rules) {
      graph.trackDelegation(name, rule.target_agent);
    }
  }
  for (const [name, def] of Object.entries(metaAgents)) {
    const path2 = [];
    for (const delegate of def.delegates_to) {
      if (graph.checkCircular(delegate, name, maxDepth)) {
        path2.push(name, delegate);
        errors.push(
          createCircularDependencyError(
            `Circular dependency detected: "${name}" delegates to "${delegate}" which can route back to "${name}"`,
            path2,
            [name, delegate]
          )
        );
      }
    }
    for (const rule of def.routing_rules) {
      if (graph.checkCircular(rule.target_agent, name, maxDepth)) {
        path2.push(name, rule.target_agent);
        errors.push(
          createCircularDependencyError(
            `Circular dependency detected: "${name}" can route to "${rule.target_agent}" which can route back to "${name}"`,
            path2,
            [name, rule.target_agent]
          )
        );
      }
    }
    for (const delegate of def.delegates_to) {
      if (delegate in metaAgents && delegate !== name) {
        if (graph.checkCircular(delegate, name, maxDepth)) {
          path2.push(name, delegate);
          errors.push(
            createCircularDependencyError(
              `Circular dependency detected between meta-agents: "${name}" -> "${delegate}"`,
              path2,
              [name, delegate]
            )
          );
        }
      }
    }
  }
  return errors;
}
function checkCircularDependenciesInConfig(config, context) {
  const result = createCheckResult("circular_dependency");
  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }
  const maxDepth = config.settings?.max_delegation_depth ?? 3;
  const errors = checkCircularDependencies(config.meta_agents, maxDepth);
  if (errors.length > 0) {
    result.passed = false;
    result.errors.push(...errors);
  } else {
    result.passed = true;
  }
  return result;
}
function checkAgentReferences(metaAgents) {
  const errors = [];
  if (Object.keys(metaAgents).length === 0) {
    return errors;
  }
  const validAgents = /* @__PURE__ */ new Set([...BUILTIN_AGENT_NAMES, ...Object.keys(metaAgents)]);
  for (const [agentName, def] of Object.entries(metaAgents)) {
    for (const delegate of def.delegates_to) {
      if (!validAgents.has(delegate)) {
        errors.push(
          createInvalidAgentReferenceError(
            `Invalid agent reference: "${delegate}" is not a recognized agent. Valid agents are: ${[...BUILTIN_AGENT_NAMES].join(", ")}`,
            ["meta_agents", agentName, "delegates_to"],
            delegate
          )
        );
      }
    }
    for (const [ruleIndex, rule] of def.routing_rules.entries()) {
      if (!validAgents.has(rule.target_agent)) {
        errors.push(
          createInvalidAgentReferenceError(
            `Invalid agent reference: "${rule.target_agent}" is not a recognized agent. Valid agents are: ${[...BUILTIN_AGENT_NAMES].join(", ")}`,
            ["meta_agents", agentName, "routing_rules", String(ruleIndex), "target_agent"],
            rule.target_agent
          )
        );
      }
    }
  }
  return errors;
}
function checkAgentReferencesInConfig(config, context) {
  const result = createCheckResult("agent_reference");
  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }
  const errors = checkAgentReferences(config.meta_agents);
  if (errors.length > 0) {
    result.passed = false;
    result.errors.push(...errors);
  } else {
    result.passed = true;
  }
  return result;
}
function analyzeRegexPattern(pattern) {
  const complexLookaround = /\(\?[=!][^)]*[+*?]\)|\(\?<[=!][^)]*[+*?]\)/.test(pattern);
  if (complexLookaround) {
    return {
      hasIssue: true,
      reason: "Complex lookaheads/lookbehinds with quantifiers can be slow"
    };
  }
  const nestedQuantifiers = /(\([^)]*[+*?][^)]*\)[+*?]|([+*?][+*?]))/.test(pattern);
  if (nestedQuantifiers) {
    return {
      hasIssue: true,
      reason: "Nested quantifiers can cause catastrophic backtracking"
    };
  }
  const overlappingAlternation = /(\w+)\|\1/.test(pattern);
  if (overlappingAlternation) {
    return {
      hasIssue: true,
      reason: "Overlapping alternation can cause inefficient backtracking"
    };
  }
  const unboundedDot = /\^\.\*|\.\*\$|\.\*$|\.\*\.\*/.test(pattern);
  if (unboundedDot) {
    return {
      hasIssue: true,
      reason: "Unbounded .* patterns can match excessively and cause performance issues"
    };
  }
  const largeRepetition = /\[[^\]]+\][+*?]*\{\d{2,}/.test(pattern);
  if (largeRepetition) {
    return {
      hasIssue: true,
      reason: "Large repetition quantifiers can cause excessive backtracking"
    };
  }
  const backreferences = /\\\d/.test(pattern);
  if (backreferences) {
    return {
      hasIssue: true,
      reason: "Backreferences prevent efficient regex compilation and can be slow"
    };
  }
  const excessiveAlternations = (pattern.match(/\|/g) || []).length > 8;
  if (excessiveAlternations) {
    return {
      hasIssue: true,
      reason: "Many alternations can cause the regex engine to try many paths"
    };
  }
  return {
    hasIssue: false,
    reason: ""
  };
}
function checkRegexPerformance(metaAgents) {
  const warnings = [];
  if (Object.keys(metaAgents).length === 0) {
    return warnings;
  }
  for (const [agentName, def] of Object.entries(metaAgents)) {
    for (const [ruleIndex, rule] of def.routing_rules.entries()) {
      if (rule.matcher.type === "regex") {
        const pattern = rule.matcher.pattern;
        const analysis = analyzeRegexPattern(pattern);
        if (analysis.hasIssue) {
          warnings.push(
            createRegexPerformanceWarning(
              `Regex pattern may cause performance issues: ${analysis.reason}`,
              ["meta_agents", agentName, "routing_rules", String(ruleIndex), "matcher", "pattern"],
              pattern,
              analysis.reason
            )
          );
        }
      }
    }
  }
  return warnings;
}
function checkRegexPerformanceInConfig(config, context) {
  const result = createCheckResult("regex_performance");
  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }
  const warnings = checkRegexPerformance(config.meta_agents);
  if (warnings.length > 0) {
    result.passed = true;
    result.warnings.push(...warnings);
  } else {
    result.passed = true;
  }
  return result;
}

// src/config/project-io.ts
async function exportProjectConfig(config, projectDir, options) {
  const result = OlimpusConfigSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  ${issue.path.join(".")} - ${issue.message}`).join("\n");
    throw new Error(`Invalid olimpus config:
${errors}`);
  }
  const shouldValidate = options?.validate ?? true;
  if (shouldValidate) {
    const validationResult = validateOlimpusConfig(result.data, {
      checkCircularDependencies: options?.checkCircularDependencies ?? true,
      checkAgentReferences: options?.checkAgentReferences ?? true,
      checkRegexPerformance: options?.checkRegexPerformance ?? true
    });
    if (!validationResult.valid) {
      const errorMessages = formatErrors(validationResult).join("\n");
      const warningMessages = formatWarnings(validationResult).join("\n");
      const message = `Configuration validation failed:
${errorMessages}${warningMessages ? `

Warnings:
${warningMessages}` : ""}`;
      throw new Error(message);
    }
    if (validationResult.warnings.length > 0) {
      const warningMessages = formatWarnings(validationResult).join("\n");
    }
  }
  const location = options?.location ?? "user";
  let exportPath;
  if (location === "user") {
    const homeDir = process.env.HOME ?? ".";
    exportPath = path.join(homeDir, ".config", "opencode", "olimpus.jsonc");
  } else {
    exportPath = path.join(projectDir, "olimpus.jsonc");
  }
  const createDir = options?.createDir ?? true;
  if (createDir) {
    const dirPath = path.dirname(exportPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  const indent = options?.indent ?? 2;
  const formatted = JSON.stringify(config, null, indent);
  fs.writeFileSync(exportPath, formatted, "utf-8");
  return exportPath;
}
async function importProjectConfig(projectDir, options) {
  const location = options?.location ?? "project";
  let importPath;
  if (location === "user") {
    const homeDir = process.env.HOME ?? ".";
    importPath = path.join(homeDir, ".config", "opencode", "olimpus.jsonc");
  } else {
    importPath = path.join(projectDir, "olimpus.jsonc");
  }
  if (!fs.existsSync(importPath)) {
    throw new Error(
      `Configuration file not found: ${importPath}`
    );
  }
  const content = fs.readFileSync(importPath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse configuration file: ${message}`);
  }
  const result = OlimpusConfigSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  ${issue.path.join(".")} - ${issue.message}`).join("\n");
    throw new Error(`Invalid olimpus config:
${errors}`);
  }
  const warnings = [];
  const shouldValidate = options?.validate ?? true;
  if (shouldValidate) {
    const validationResult = validateOlimpusConfig(result.data, {
      checkCircularDependencies: options?.checkCircularDependencies ?? true,
      checkAgentReferences: options?.checkAgentReferences ?? true,
      checkRegexPerformance: options?.checkRegexPerformance ?? true
    });
    if (!validationResult.valid) {
      const errorMessages = formatErrors(validationResult).join("\n");
      const warningMessages = formatWarnings(validationResult).join("\n");
      const message = `Configuration validation failed:
${errorMessages}${warningMessages ? `

Warnings:
${warningMessages}` : ""}`;
      throw new Error(message);
    }
    if (validationResult.warnings.length > 0) {
      warnings.push(...formatWarnings(validationResult));
    }
  }
  return {
    config: result.data,
    warnings
  };
}
export {
  exportProjectConfig,
  importProjectConfig
};
//# sourceMappingURL=project-io.js.map
