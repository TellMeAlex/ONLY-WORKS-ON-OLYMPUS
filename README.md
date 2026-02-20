# Olimpus Plugin

**A meta-orchestrator for oh-my-opencode that routes requests to specialized agents using intelligent matching rules.**

Olimpus sits on top of oh-my-opencode and adds a routing layer. Instead of directly using builtin agents (sisyphus, oracle, librarian, etc.), you define **meta-agents** that intelligently decide which builtin agent to delegate to based on the user's request.

Think of it as: **Meta-agents = smart routers | Builtin agents = specialized workers**

---

## Overview

Olimpus is a plugin for [oh-my-opencode](https://github.com/opencode-ai/oh-my-opencode) that enables **intelligent request routing** through customizable meta-agents.

### The Problem It Solves

Oh-my-opencode provides powerful builtin agents (sisyphus for implementation, oracle for analysis, librarian for research, etc.), but selecting the right agent for each task is a manual decision. Olimpus automates this decision through **routing rules**.

### The Solution

1. **Define meta-agents** with routing rules (e.g., "Atenea" for strategic planning)
2. **Configure matchers** (keyword, complexity, regex, project context)
3. **Set delegation targets** (which builtin agents can handle this type of request)
4. **Olimpus automatically routes** user requests to the best agent

---

## Features

### 🎯 Intelligent Routing
- **5 matcher types**: keyword, complexity, regex, project_context, always
- **First-match-wins semantics**: rules evaluated in order
- **Type-safe configuration**: Zod v4 schema validation

### 🔌 Meta-Agent System
- **Atenea**: Strategic planning & architecture analysis (routes to oracle, prometheus, atlas)
- **Hermes**: Communication & research (routes to librarian, explore, oracle)
- **Hefesto**: Implementation & building (routes to sisyphus, hephaestus)
- **Custom meta-agents**: Define your own routing logic

### 📦 Skill Bundling
- Load custom skills from project files
- Automatic namespace prefixing (`olimpus:` prefix)
- Conflict-free merging with oh-my-opencode skills

### 🛡️ Safety Features
- Circular dependency detection
- Max delegation depth enforcement
- Comprehensive error handling

---

## Installation

### 1. Install Dependencies

Using Bun (recommended):
```bash
bun install olimpus-plugin
```

Or npm:
```bash
npm install olimpus-plugin
```

### 2. Add to oh-my-opencode

Edit your `.opencode.jsonc` or `.opencode.yaml` to register the Olimpus plugin:

```jsonc
// .opencode.jsonc
{
  "plugins": [
    {
      "name": "olimpus",
      "module": "olimpus-plugin"
    }
  ]
}
```

### 3. Create olimpus.jsonc Config

In your project root, create `olimpus.jsonc`:

```jsonc
{
  "meta_agents": {
    "atenea": {
      // ... meta-agent definition
    }
  },
  "settings": {
    "max_delegation_depth": 3
  }
}
```

Full example available in [example/olimpus.jsonc](./example/olimpus.jsonc).

### 4. Build & Development

This package uses a **dual build system** to support both Node.js and Bun runtimes:

- **dist-node/** - Node.js compatible build (via esbuild, main entry point)
- **dist-bun/** - Bun-optimized build (via Bun bundler)

#### Build Commands

```bash
# Build everything (Node.js + Bun + schema)
bun run build

# Build only for Node.js
bun run build:node

# Build only for Bun
bun run build:bun

# Type checking
bun run typecheck

# Regenerate JSON schema
bun run schema:generate

# Clean rebuild
bun run rebuild
```

#### Why Dual Builds?

Bun and Node.js have different runtime capabilities:
- **Bun**: Direct access to `Bun.*` APIs, better bundling for dependencies like `jsonc-parser`
- **Node.js**: Standard CommonJS/ESM modules, but Bun's bundling can break require() chains

The esbuild build (dist-node) marks common dependencies as external, letting Node.js module resolution handle them properly. The Bun build keeps everything bundled for maximum performance.

---

## Configuration

### Config File Location

Olimpus searches for configuration in this order (first found wins):
1. **Project root**: `./olimpus.jsonc` (highest priority)
2. **User config**: `~/.config/opencode/olimpus.jsonc`

### Config Structure

```jsonc
{
  // Meta-agents: Define routing logic
  "meta_agents": {
    "agent_name": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["builtin_agent1", "builtin_agent2"],
      "routing_rules": [ /* see below */ ]
    }
  },

  // Agent overrides: Customize builtin agents
  "agents": {
    "sisyphus": { "model": "...", "temperature": 0.3 }
  },

  // Category config: Group related tasks
  "categories": {
    "frontend": { "model": "...", "temperature": 0.2 }
  },

  // Olimpus settings
  "settings": {
    "namespace_prefix": "olimpus",
    "max_delegation_depth": 3
  },

  // Custom skills
  "skills": ["docs/skills/my-skill.md"],

  // Disabled hooks (pass-through to oh-my-opencode)
  "disabled_hooks": []
}
```

---

## Meta-Agents

Each meta-agent is a routing coordinator that decides which builtin agent to delegate to.

### Built-in Meta-Agents

#### Atenea (Strategic Planning)
```
Routes based on complexity: high → oracle | medium → prometheus | low → atlas
```

Handles:
- Architecture decisions
- System design analysis
- Strategic planning
- Complex technical problems

#### Hermes (Communication & Research)
```
Routes based on keywords: docs → librarian | code → explore | analyze → oracle
```

Handles:
- Documentation research
- Codebase exploration
- Information synthesis
- Comparative analysis

#### Hefesto (Implementation)
```
Routes based on project context: has_tests → sisyphus | else → hephaestus
```

Handles:
- Feature implementation
- Bug fixes
- Code refactoring
- Build & testing

### Defining Custom Meta-Agents

```jsonc
{
  "meta_agents": {
    "my_agent": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "hephaestus"],
      "temperature": 0.3,
      "prompt_template": "Custom system prompt...",
      
      "routing_rules": [
        {
          "matcher": { /* see matcher types */ },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Override system prompt for this route",
            "model": "gpt-4-turbo",
            "temperature": 0.5,
            "variant": "analysis"
          }
        }
      ]
    }
  }
}
```

---

## Routing Rules

Routing rules determine which builtin agent handles a request. Rules are evaluated in order; the first match wins.

### Matcher Types

#### 1. Keyword Matcher
Matches if prompt contains specified keywords (case-insensitive).

```jsonc
{
  "matcher": {
    "type": "keyword",
    "keywords": ["docs", "documentation", "guide"],
    "mode": "any"  // "any" = ≥1 keyword | "all" = all keywords required
  },
  "target_agent": "librarian"
}
```

#### 2. Complexity Matcher
Routes based on heuristic complexity scoring (line count + keyword density).

```jsonc
{
  "matcher": {
    "type": "complexity",
    "threshold": "high"  // "low" | "medium" | "high"
  },
  "target_agent": "oracle"
}
```

Scoring:
- Base: `Math.ceil(lineCount / 10)` points
- Keywords: +1 per technical keyword (architecture, performance, database, etc.)
- Thresholds: low=2, medium=5, high=10

#### 3. Regex Matcher
Routes based on regex pattern matching.

```jsonc
{
  "matcher": {
    "type": "regex",
    "pattern": "^(design|ui|component|button)",
    "flags": "i"  // Optional: regex flags (default: "i" for case-insensitive)
  },
  "target_agent": "hephaestus"
}
```

#### 4. Project Context Matcher
Routes based on project structure (files and dependencies).

```jsonc
{
  "matcher": {
    "type": "project_context",
    "has_files": ["package.json", "src/"],
    "has_deps": ["vitest", "jest"]  // Any one of these satisfies "has_deps"
  },
  "target_agent": "sisyphus"
}
```

#### 5. Always Matcher
Catch-all fallback (matches everything).

```jsonc
{
  "matcher": {
    "type": "always"
  },
  "target_agent": "hephaestus"
}
```

### Matcher Evaluation Order

```
keyword → complexity → regex → project_context → always (fallback)
```

**First match wins**: Once a matcher returns true, remaining rules are skipped.

### Config Overrides

Each routing rule can override agent configuration:

```jsonc
"config_overrides": {
  "model": "gpt-4-turbo",           // Override model
  "temperature": 0.3,                // Override temperature
  "prompt": "Custom instructions...", // Override system prompt
  "variant": "tdd"                   // Set variant tag
}
```

---

## Development

### Build

```bash
# TypeScript compile
bun run build

# Type check only
bun run typecheck

# Watch mode
bun run watch
```

### Test

```bash
# Run all tests
bun test

# Run specific test
bun test src/agents/routing.test.ts

# Watch mode
bun test --watch
```

### Project Structure

```
src/
├── config/
│   ├── schema.ts          # Zod v4 config validation
│   ├── loader.ts          # JSONC parsing & merging
│   └── translator.ts      # OMO compatibility translation
├── agents/
│   ├── routing.ts         # Routing engine (5 matchers)
│   ├── meta-agent.ts      # Meta-agent factory
│   ├── registry.ts        # Meta-agent registry & circular detection
│   └── definitions/
│       ├── atenea.ts      # Strategic planning meta-agent
│       ├── hermes.ts      # Communication meta-agent
│       └── hefesto.ts     # Implementation meta-agent
├── plugin/
│   ├── wrapper.ts         # Plugin interface merging
│   └── wrapper.test.ts    # Merge tests
├── skills/
│   ├── types.ts           # Skill type definitions
│   ├── loader.ts          # Skill loading & merging
│   └── loader.test.ts     # Skill tests
└── index.ts               # Plugin entry point

example/
└── olimpus.jsonc          # Example configuration
```

---

## Architecture

### Request Flow

```
User Prompt
    ↓
[Olimpus Plugin Entry Point]
    ↓
[Load olimpus.jsonc Config]
    ↓
[Create MetaAgentRegistry]
    ↓
[Evaluate Routing Rules]
    ↓
[Select Builtin Agent]
    ↓
[Delegate via Task Tool]
    ↓
[Builtin Agent Executes]
    ↓
Response
```

### Key Components

#### 1. Config System (src/config/)
- **schema.ts**: Zod v4 schema validation
- **loader.ts**: Loads & merges olimpus.jsonc (project + user)
- **translator.ts**: Extracts oh-my-opencode passthrough config

#### 2. Routing Engine (src/agents/routing.ts)
- Evaluates 5 matcher types against user prompt
- Implements first-match-wins semantics
- Returns resolved route or null

#### 3. Meta-Agent System (src/agents/)
- **meta-agent.ts**: Factory for generating AgentConfig from MetaAgentDef
- **registry.ts**: Tracks meta-agent definitions, detects circular dependencies
- **definitions/**: Built-in meta-agent implementations (atenea, hermes, hefesto)

#### 4. Plugin Wrapper (src/plugin/wrapper.ts)
- Merges Olimpus PluginInterface with oh-my-opencode base interface
- Chains config handlers and other hook types
- Returns single merged PluginInterface to framework

#### 5. Skill System (src/skills/)
- Loads skill definitions from YAML frontmatter
- Applies `olimpus:` namespace prefix
- Merges with oh-my-opencode skills (no conflicts)

#### 6. Entry Point (src/index.ts)
- Orchestrates all 5 components
- Implements error handling & defaults
- Returns final PluginInterface for oh-my-opencode

### Type Safety

- **Zod v4 schema**: All config validated at startup
- **Discriminated unions**: Matcher types enforce exhaustiveness
- **TypeScript strict mode**: All files compiled with `strict: true`
- **No `any` types**: All code uses proper types or `unknown`

---

## Configuration Examples

### Example 1: Simple Keyword-Based Routing

```jsonc
{
  "meta_agents": {
    "support": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["librarian", "oracle"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["bug", "error", "fix"],
            "mode": "any"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a debugging expert. Find and explain the root cause."
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "librarian",
          "config_overrides": {
            "prompt": "You are a support specialist. Find relevant documentation."
          }
        }
      ]
    }
  }
}
```

### Example 2: Project-Context Based Routing

```jsonc
{
  "meta_agents": {
    "builder": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["Makefile"],
            "has_deps": ["make"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Use make commands to build. Write comprehensive tests."
          }
        },
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["package.json"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Use npm/bun scripts. Follow package.json conventions."
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "hephaestus"
        }
      ]
    }
  }
}
```

### Example 3: Complex Multi-Rule Routing

```jsonc
{
  "meta_agents": {
    "fullstack": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "hephaestus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "(database|sql|postgres|redis)",
            "flags": "i"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a database architect. Design scalable data solutions."
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "test-driven", "spec"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Write tests first, then implementation (TDD)."
          }
        },
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Analyze from first principles. Consider all trade-offs."
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "hephaestus"
        }
      ]
    }
  }
}
```

---

## Troubleshooting

### Config Not Loading

```
Warning: No olimpus.jsonc found. Using defaults.
```

**Solution**: 
- Create `olimpus.jsonc` in project root or `~/.config/opencode/`
- Check file syntax with `bun run typecheck`

### Routing Not Matching

**Debug**:
1. Check routing order (first match wins)
2. Print routing context: `console.log({ prompt, projectDir, projectFiles, projectDeps })`
3. Verify matcher syntax matches examples

### Circular Delegation Detected

```
Error: Circular delegation detected: atenea → hermes → atenea
```

**Solution**:
- Review meta-agent definitions for cycles
- Ensure `delegates_to` doesn't indirectly loop back
- Increase `max_delegation_depth` if chain is deep but valid

### Skills Not Loading

```
Warning: Failed to load skill: docs/skills/custom.md - file not found
```

**Solution**:
- Check `skills` array paths are relative to project root
- Verify `.md` files have YAML frontmatter:
  ```md
  ---
  template: |
    ...
  ---
  ```

---

## API Reference

### OlimpusPlugin

Main plugin export (default).

```typescript
import OlimpusPlugin from "olimpus-plugin";

const plugin = await OlimpusPlugin(input);
```

**Parameters**: `input: PluginInput` (from @opencode-ai/plugin)

**Returns**: `Promise<PluginInterface>`

### createOlimpusWrapper

Merges Olimpus config with oh-my-opencode plugin interface.

```typescript
import { createOlimpusWrapper } from "olimpus-plugin/plugin/wrapper";

const merged = await createOlimpusWrapper(input, config);
```

### MetaAgentRegistry

Tracks meta-agent definitions and detects circular dependencies.

```typescript
import { MetaAgentRegistry } from "olimpus-plugin/agents/registry";

const registry = new MetaAgentRegistry(3); // max depth = 3
registry.register("atenea", atenoaDef);
const config = registry.resolve("atenea", context);
```

### evaluateRoutingRules

Evaluates routing rules against context.

```typescript
import { evaluateRoutingRules } from "olimpus-plugin/agents/routing";

const route = evaluateRoutingRules(rules, context);
if (route) {
  console.log(`Route to: ${route.target_agent}`);
}
```

### loadOlimpusConfig

Loads and validates olimpus.jsonc configuration.

```typescript
import { loadOlimpusConfig } from "olimpus-plugin/config/loader";

const config = loadOlimpusConfig(projectDir);
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

---

## License

MIT © 2024 Olimpus Contributors

---

## See Also

- [oh-my-opencode](https://github.com/opencode-ai/oh-my-opencode) - Base plugin framework
- [example/olimpus.jsonc](./example/olimpus.jsonc) - Full configuration example
- [src/config/schema.ts](./src/config/schema.ts) - Zod v4 config schema
