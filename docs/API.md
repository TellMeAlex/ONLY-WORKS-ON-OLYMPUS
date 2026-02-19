# API Reference

**Complete TypeScript API documentation for Olimpus Plugin.**

This document describes all exported types, functions, and classes available when using the Olimpus Plugin.

---

## Table of Contents

- [Core Plugin](#core-plugin)
  - [OlimpusPlugin](#olimpusplugin)
- [Plugin Wrapper](#plugin-wrapper)
  - [createOlimpusWrapper](#createolimpuswrapper)
  - [mergePluginInterfaces](#mergeplugininterfaces)
  - [PluginInterface](#plugininterface)
- [Meta-Agent Registry](#meta-agent-registry)
  - [MetaAgentRegistry](#metaagentregistry-class)
- [Routing System](#routing-system)
  - [evaluateRoutingRules](#evaluateroutingrules)
  - [evaluateMatcher](#evaluatematcher)
  - [RoutingContext](#routingcontext)
  - [ResolvedRoute](#resolvedroute)
- [Configuration](#configuration)
  - [loadOlimpusConfig](#loadolimpusconfig)
  - [LoadOlimpusConfigOptions](#loadolimpusconfigoptions)
  - [OlimpusConfig](#olimpusconfig)
- [Skill System](#skill-system)
  - [loadOlimpusSkills](#loadolimpusskills)
  - [mergeSkills](#mergeskills)
  - [SkillDefinition](#skilldefinition)
- [Types](#types)
  - [Matcher Types](#matcher-types)
  - [RoutingRule](#routingrule)
  - [MetaAgentDef](#metaagentdef)

---

## Core Plugin

### OlimpusPlugin

Main plugin entry point for oh-my-opencode integration.

**Type:** `Plugin`

**Location:** `src/index.ts`

```typescript
import OlimpusPlugin from "olimpus-plugin";

const plugin = await OlimpusPlugin(input);
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `input` | `PluginInput` | From @opencode-ai/plugin. Contains client, project, directory, etc. |

**Returns:** `Promise<PluginInterface>`

**Throws:** `Error` if configuration fails to load or oh-my-opencode initialization fails.

**Execution Flow:**

1. Loads `olimpus.jsonc` from project directory (or user config fallback)
2. Creates `MetaAgentRegistry` with configured max delegation depth
3. Registers all meta-agents from config and built-in definitions
4. Creates plugin wrapper via `createOlimpusWrapper()`
5. Enhances config handler to register meta-agent AgentConfigs
6. Loads and merges Olimpus skills if configured
7. Returns merged PluginInterface

**Example:**

```typescript
import OlimpusPlugin from "olimpus-plugin";
import type { PluginInput } from "@opencode-ai/plugin";

const input: PluginInput = {
  client: anthropicClient,
  project: projectConfig,
  directory: "/path/to/project"
};

const plugin = await OlimpusPlugin(input);
// plugin is now a PluginInterface with all OMO + Olimpus hooks
```

---

## Plugin Wrapper

### createOlimpusWrapper

Creates the merged plugin interface combining oh-my-opencode with Olimpus extensions.

**Location:** `src/plugin/wrapper.ts`

```typescript
import { createOlimpusWrapper } from "olimpus-plugin/plugin/wrapper";

const merged = await createOlimpusWrapper(input, config);
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `input` | `PluginInput` | From @opencode-ai/plugin. Contains client, project, directory, etc. |
| `config` | `OlimpusConfig` | Olimpus configuration with routing rules and meta-agents |

**Returns:** `Promise<PluginInterface>`

**Description:**

This function:

1. Translates `OlimpusConfig` to OMO-compatible config using `translateToOMOConfig()`
2. Calls the oh-my-opencode plugin to get base handlers
3. Extracts Olimpus meta-agent definitions
4. Creates Olimpus extension handlers
5. Merges the base `PluginInterface` with Olimpus extensions
6. Returns the combined `PluginInterface`

**Merge Strategy:**

- **Tool handlers:** Extension overwrites base
- **Config handler:** Chains both (base first, then extension)
- **Event/Hook handlers:** Chains all handlers (base first, then extension)
- **Other properties:** Extension overwrites base

### mergePluginInterfaces

Merges two PluginInterfaces into one combined interface.

**Location:** `src/plugin/wrapper.ts`

```typescript
import { mergePluginInterfaces, type PluginInterface } from "olimpus-plugin/plugin/wrapper";

const merged = mergePluginInterfaces(basePluginInterface, olimpusExtension);
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `base` | `PluginInterface` | Base PluginInterface (typically from oh-my-opencode) |
| `extension` | `PluginInterface` | Extension PluginInterface (from Olimpus) |

**Returns:** `PluginInterface`

### PluginInterface

Type alias for the Hooks type returned by plugins. Defines the contract between plugins and the oh-my-opencode framework.

**Type:** `Hooks` (from @opencode-ai/plugin)

**Location:** `src/plugin/wrapper.ts`

```typescript
import type { PluginInterface } from "olimpus-plugin/plugin/wrapper";

const interface: PluginInterface = {
  config: async (configInput) => { ... },
  event: async (eventInput) => { ... },
  tool: { /* tool handlers */ },
  // ... other hooks
};
```

---

## Meta-Agent Registry

### MetaAgentRegistry Class

Registry for meta-agents with delegation tracking and circular dependency detection.

**Location:** `src/agents/registry.ts`

```typescript
import { MetaAgentRegistry } from "olimpus-plugin/agents/registry";

const registry = new MetaAgentRegistry(3); // max depth = 3
registry.register("atenea", ateneaDef);
const config = registry.resolve("atenea", context);
```

#### Constructor

```typescript
new MetaAgentRegistry(maxDepth?: number, loggerConfig?: RoutingLoggerConfig)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `maxDepth` | `number` | Maximum delegation depth before circular detection triggers. Default: `3` |
| `loggerConfig` | `RoutingLoggerConfig` | Optional logger configuration for debugging routing |

#### Methods

##### `register(name: string, def: MetaAgentDef): void`

Register a meta-agent definition.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | Unique name for the meta-agent |
| `def` | `MetaAgentDef` | Meta-agent definition with routing rules |

**Example:**

```typescript
registry.register("my-agent", {
  base_model: "claude-3-5-sonnet-20241022",
  delegates_to: ["oracle", "hephaestus"],
  routing_rules: [
    {
      matcher: { type: "keyword", keywords: ["bug"], mode: "any" },
      target_agent: "oracle"
    }
  ]
});
```

##### `getAll(): Record<string, MetaAgentDef>`

Get all registered meta-agent definitions.

**Returns:** `Record<string, MetaAgentDef>` - Map of agent names to definitions

##### `resolve(name: string, context: RoutingContext): AgentConfig | null`

Resolve a meta-agent to its AgentConfig by evaluating routing rules.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | Name of the meta-agent to resolve |
| `context` | `RoutingContext` | Context containing prompt, project info, etc. |

**Returns:** `AgentConfig | null` - Agent configuration if route matches, `null` otherwise

**Throws:** `Error` if meta-agent not registered

##### `trackDelegation(from: string, to: string): void`

Track a delegation from one agent to another. Used for circular dependency detection.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `from` | `string` | Source agent name |
| `to` | `string` | Target agent name |

##### `checkCircular(from: string, to: string, maxDepth?: number): boolean`

Check if a delegation would create a circular dependency.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `from` | `string` | Source agent name |
| `to` | `string` | Target agent name |
| `maxDepth` | `number` | Optional depth limit. Default: uses instance max depth |

**Returns:** `boolean` - `true` if circular, `false` if safe

##### `getMaxTrackedDepth(): number`

Get current delegation depth (longest chain tracked).

**Returns:** `number` - Maximum depth of tracked delegation chains

---

## Routing System

### evaluateRoutingRules

Evaluates routing rules in order and returns the first matching route.

**Location:** `src/agents/routing.ts`

```typescript
import { evaluateRoutingRules } from "olimpus-plugin/agents/routing";

const route = evaluateRoutingRules(rules, context, logger);
if (route) {
  console.log(`Route to: ${route.target_agent}`);
}
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `rules` | `RoutingRule[]` | Array of routing rules to evaluate (in order) |
| `context` | `RoutingContext` | Context containing prompt, project info, etc. |
| `logger` | `RoutingLogger` | Optional logger for debugging routing decisions |

**Returns:** `ResolvedRoute | null` - First matching route, or `null` if no rules match

**Behavior:**

- Rules are evaluated in order
- First match wins (remaining rules are skipped)
- Supports 5 matcher types: keyword, complexity, regex, project_context, always
- Optional logger tracks evaluation for debugging

### evaluateMatcher

Evaluates a single matcher against the routing context.

**Location:** `src/agents/routing.ts`

```typescript
import { evaluateMatcher } from "olimpus-plugin/agents/routing";

const matched = evaluateMatcher(matcher, context);
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `matcher` | `Matcher` | Matcher definition (discriminated union) |
| `context` | `RoutingContext` | Context to evaluate against |

**Returns:** `boolean` - `true` if matcher matches, `false` otherwise

### RoutingContext

Context passed to routing evaluation functions.

**Location:** `src/agents/routing.ts`

```typescript
interface RoutingContext {
  prompt: string;
  projectDir: string;
  projectFiles?: string[];
  projectDeps?: string[];
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `prompt` | `string` | User prompt to match against |
| `projectDir` | `string` | Path to project directory |
| `projectFiles` | `string[]` | Optional list of project files for context matching |
| `projectDeps` | `string[]` | Optional list of project dependencies for context matching |

### ResolvedRoute

Result of successful routing evaluation.

**Location:** `src/agents/routing.ts`

```typescript
interface ResolvedRoute {
  target_agent: string;
  config_overrides?: {
    model?: string;
    temperature?: number;
    prompt?: string;
    variant?: string;
  };
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `target_agent` | `string` | Name of the target agent to route to |
| `config_overrides` | `object` | Optional configuration overrides for the target agent |

---

## Configuration

### loadOlimpusConfig

Loads and validates `olimpus.jsonc` configuration from project or user config directory.

**Location:** `src/config/loader.ts`

```typescript
import { loadOlimpusConfig } from "olimpus-plugin/config/loader";

const config = await loadOlimpusConfig("/path/to/project", {
  validate: true,
  checkCircularDependencies: true,
  checkAgentReferences: true,
  checkRegexPerformance: true
});
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `projectDir` | `string` | Path to the project directory |
| `options` | `LoadOlimpusConfigOptions` | Optional configuration for loading and validation |

**Returns:** `Promise<OlimpusConfig>` - Parsed and validated configuration

**Throws:** `Error` if config is invalid according to schema or semantic validation

**Config Search Order:**

1. Project root: `./olimpus.jsonc` (highest priority)
2. User config: `~/.config/opencode/olimpus.jsonc`

**Merge Behavior:**

- Project config overrides user config (deep merge)
- Arrays are replaced entirely (not merged)
- Defaults are applied for missing optional fields

**Wizard Mode:**

- When no config exists, automatically runs interactive wizard
- Set `OLIMPUS_SKIP_WIZARD=1` environment variable to skip wizard
- Silent scaffolding is used when wizard is skipped

### LoadOlimpusConfigOptions

Options for loading Olimpus configuration.

**Location:** `src/config/loader.ts`

```typescript
interface LoadOlimpusConfigOptions {
  validate?: boolean;
  checkCircularDependencies?: boolean;
  checkAgentReferences?: boolean;
  checkRegexPerformance?: boolean;
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `validate` | `boolean` | `true` | Whether to perform semantic validation |
| `checkCircularDependencies` | `boolean` | `true` | Whether to check circular dependencies |
| `checkAgentReferences` | `boolean` | `true` | Whether to validate agent references |
| `checkRegexPerformance` | `boolean` | `true` | Whether to analyze regex patterns for performance issues |

### OlimpusConfig

Complete Olimpus configuration type.

**Location:** `src/config/schema.ts`

```typescript
interface OlimpusConfig {
  // Olimpus-specific sections
  meta_agents?: Record<string, MetaAgentDef>;
  providers?: ProviderConfig;
  settings?: Settings;
  skills?: string[];

  // oh-my-opencode passthrough sections
  agents?: Record<string, AgentOverride>;
  categories?: Record<string, CategoryConfig>;
  disabled_hooks?: string[];
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `meta_agents` | `Record<string, MetaAgentDef>` | Meta-agent definitions with routing rules |
| `providers` | `ProviderConfig` | Provider configuration for LLM API |
| `settings` | `Settings` | Olimpus plugin settings |
| `skills` | `string[]` | Paths to custom skill files |
| `agents` | `Record<string, AgentOverride>` | Builtin agent overrides |
| `categories` | `Record<string, CategoryConfig>` | Category configurations |
| `disabled_hooks` | `string[]` | Hooks to disable (passthrough) |

---

## Skill System

### loadOlimpusSkills

Loads Olimpus skills from specified markdown file paths.

**Location:** `src/skills/loader.ts`

```typescript
import { loadOlimpusSkills } from "olimpus-plugin/skills/loader";

const skills = loadOlimpusSkills(
  ["docs/skills/my-skill.md", "docs/skills/another.md"],
  "/path/to/project"
);
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `skillPaths` | `string[]` | Array of paths to skill markdown files |
| `projectDir` | `string` | Project directory for resolving relative paths |

**Returns:** `SkillDefinition[]` - Array of loaded skill definitions

**Behavior:**

- Reads markdown files and parses YAML frontmatter
- Extracts metadata (description, agent, model, etc.)
- Applies `olimpus:` namespace prefix to skill names
- Skips non-existent files with warning
- Skips non-markdown files with warning

**Frontmatter Format:**

```markdown
---
description: My custom skill
agent: oracle
model: claude-3-5-sonnet-20241022
argument-hint: <query>
allowed-tools: [Read, Grep]
subtask: true
---

This is the skill template content.
```

### mergeSkills

Merges base skills (from oh-my-opencode) with Olimpus skills.

**Location:** `src/skills/loader.ts`

```typescript
import { mergeSkills } from "olimpus-plugin/skills/loader";

const mergedSkills = mergeSkills(baseSkills, olimpusSkills);
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `baseSkills` | `SkillDefinition[]` | Base skills from oh-my-opencode |
| `olimpusSkills` | `SkillDefinition[]` | Olimpus skills with `olimpus:` prefix |

**Returns:** `SkillDefinition[]` - Merged skills without duplicates

**Merge Strategy:**

- Olimpus skills use `olimpus:` prefix to avoid naming conflicts
- Olimpus skills are appended (do not overwrite base skills)
- Duplicate skill names are removed from Olimpus skills

### SkillDefinition

Loaded skill definition with metadata and scope.

**Location:** `src/skills/types.ts`

```typescript
interface SkillDefinition {
  name: string;
  path?: string;
  resolvedPath?: string;
  definition: CommandDefinition;
  scope: SkillScope;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string[];
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Skill name (with `olimpus:` prefix) |
| `path` | `string` | Original path from config |
| `resolvedPath` | `string` | Resolved absolute path |
| `definition` | `CommandDefinition` | Command definition (template, agent, model) |
| `scope` | `SkillScope` | Scope of the skill (e.g., "olimpus") |
| `license` | `string` | License information |
| `compatibility` | `string` | Compatibility notes |
| `metadata` | `Record<string, string>` | Additional metadata |
| `allowedTools` | `string[]` | Tools this skill can use |

---

## Types

### Matcher Types

Discriminated union of all matcher types.

**Location:** `src/config/schema.ts`

#### KeywordMatcher

```typescript
interface KeywordMatcher {
  type: "keyword";
  keywords: string[];
  mode: "any" | "all";
}
```

Matches if prompt contains specified keywords (case-insensitive).

#### ComplexityMatcher

```typescript
interface ComplexityMatcher {
  type: "complexity";
  threshold: "low" | "medium" | "high";
}
```

Routes based on heuristic complexity scoring (line count + keyword density).

#### RegexMatcher

```typescript
interface RegexMatcher {
  type: "regex";
  pattern: string;
  flags?: string;
}
```

Routes based on regex pattern matching.

#### ProjectContextMatcher

```typescript
interface ProjectContextMatcher {
  type: "project_context";
  has_files?: string[];
  has_deps?: string[];
}
```

Routes based on project structure (files and dependencies).

#### AlwaysMatcher

```typescript
interface AlwaysMatcher {
  type: "always";
}
```

Catch-all fallback (matches everything).

### RoutingRule

Routing rule definition.

**Location:** `src/config/schema.ts`

```typescript
interface RoutingRule {
  matcher: Matcher;
  target_agent: string;
  config_overrides?: {
    model?: string;
    temperature?: number;
    prompt?: string;
    variant?: string;
  };
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `matcher` | `Matcher` | Matcher definition |
| `target_agent` | `string` | Target agent name |
| `config_overrides` | `object` | Optional configuration overrides for this route |

### MetaAgentDef

Meta-agent definition.

**Location:** `src/config/schema.ts`

```typescript
interface MetaAgentDef {
  base_model: string;
  delegates_to: string[];
  routing_rules: RoutingRule[];
  prompt_template?: string;
  temperature?: number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `base_model` | `string` | Default model for this meta-agent |
| `delegates_to` | `string[]` | List of agents this meta-agent can delegate to |
| `routing_rules` | `RoutingRule[]` | Routing rules for selecting delegation target |
| `prompt_template` | `string` | Optional custom system prompt |
| `temperature` | `number` | Optional temperature setting |

---

## Additional Types

### Settings

Olimpus plugin settings.

**Location:** `src/config/schema.ts`

```typescript
interface Settings {
  namespace_prefix?: string;
  max_delegation_depth?: number;
  background_parallelization?: {
    enabled?: boolean;
    max_parallel_tasks?: number;
    timeout_ms?: number;
  };
  adaptive_model_selection?: {
    enabled?: boolean;
    research_model?: string;
    strategy_model?: string;
    default_model?: string;
  };
  ultrawork_enabled?: boolean;
  todo_continuation?: boolean;
  verify_before_completion?: boolean;
  lsp_refactoring_preferred?: boolean;
  aggressive_comment_pruning?: boolean;
  routing_logger?: RoutingLoggerConfig;
}
```

### RoutingLoggerConfig

Routing logger configuration for debugging.

**Location:** `src/config/schema.ts`

```typescript
interface RoutingLoggerConfig {
  enabled?: boolean;
  output?: "console" | "file" | "disabled";
  log_file?: string;
  debug_mode?: boolean;
}
```

### SkillScope

Scope of a skill definition.

**Location:** `src/skills/types.ts`

```typescript
type SkillScope = "builtin" | "config" | "user" | "project" | "olimpus";
```

### CommandDefinition

Command/skill definition compatible with oh-my-opencode format.

**Location:** `src/skills/types.ts`

```typescript
interface CommandDefinition {
  name: string;
  description?: string;
  template: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  argumentHint?: string;
  handoffs?: HandoffDefinition[];
}
```

---

## Error Handling

### Common Errors

#### `Error: Invalid olimpus config`

Schema validation failed. Check the error message for specific field issues.

```typescript
// Example error
Error: Invalid olimpus config:
  meta_agents.my_agent.delegates_to.0 - Invalid enum value. Expected 'oracle', received 'unknown'
```

#### `Error: Circular dependency detected`

Circular dependency in meta-agent delegation chain.

```typescript
// Example error
Error: Circular dependency detected: "agent_a" can route to "agent_b" which can route back to "agent_a"
```

#### `Error: Meta-agent "name" not registered`

Attempted to resolve a meta-agent that was never registered.

```typescript
// Example error
Error: Meta-agent "unknown-agent" not registered
```

---

## Examples

### Complete Plugin Setup

```typescript
import OlimpusPlugin from "olimpus-plugin";

const plugin = await OlimpusPlugin({
  client: anthropicClient,
  project: projectConfig,
  directory: "/path/to/project"
});

// Use plugin with oh-my-opencode
await plugin.config({ agent: {} });
```

### Custom Meta-Agent Registration

```typescript
import { MetaAgentRegistry, type RoutingContext } from "olimpus-plugin/agents/registry";

const registry = new MetaAgentRegistry(3);

// Register custom meta-agent
registry.register("custom-router", {
  base_model: "claude-3-5-sonnet-20241022",
  delegates_to: ["oracle", "hephaestus"],
  routing_rules: [
    {
      matcher: { type: "keyword", keywords: ["bug", "error"], mode: "any" },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a debugging expert. Find and explain the root cause."
      }
    },
    {
      matcher: { type: "always" },
      target_agent: "hephaestus"
    }
  ]
});

// Resolve based on context
const context: RoutingContext = {
  prompt: "Fix the bug in the login system",
  projectDir: "/path/to/project"
};

const config = registry.resolve("custom-router", context);
```

### Custom Routing Evaluation

```typescript
import { evaluateRoutingRules, type RoutingContext } from "olimpus-plugin/agents/routing";

const rules = [
  {
    matcher: { type: "keyword", keywords: ["test"], mode: "any" },
    target_agent: "sisyphus"
  },
  {
    matcher: { type: "always" },
    target_agent: "hephaestus"
  }
];

const context: RoutingContext = {
  prompt: "Write tests for the authentication module",
  projectDir: "/path/to/project"
};

const route = evaluateRoutingRules(rules, context);
console.log(route?.target_agent); // "sisyphus"
```

### Loading Custom Configuration

```typescript
import { loadOlimpusConfig } from "olimpus-plugin/config/loader";

try {
  const config = await loadOlimpusConfig("/path/to/project", {
    validate: true,
    checkCircularDependencies: true,
    checkAgentReferences: true,
    checkRegexPerformance: true
  });

  console.log("Loaded config:", config);
} catch (error) {
  console.error("Failed to load config:", error);
}
```

---

## See Also

- [README.md](../README.md) - Main project documentation
- [SCHEMA.md](./SCHEMA.md) - Complete schema reference
- [example/olimpus.jsonc](../example/olimpus.jsonc) - Full configuration example
