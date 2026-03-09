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

## Configuration Validation

Olimpus provides a built-in configuration validator that checks your `olimpus.jsonc` file for errors, circular dependencies, invalid agent references, and performance issues.

### Using the Validator

The `olimpus validate` command checks your configuration file and reports any issues:

```bash
# Validate your configuration file
bun run olimpus validate olimpus.jsonc

# Validate an example configuration
bun run olimpus validate ./example/olimpus.jsonc

# Show help
bun run olimpus validate --help

# Or use the direct path
bun run bin/olimpus.ts validate olimpus.jsonc
```

### What Gets Validated

#### 1. Circular Dependencies
Detects when meta-agents delegate to each other in a loop, which would cause infinite routing:

```jsonc
// ❌ INVALID - Circular dependency
{
  "meta_agents": {
    "agent_a": {
      "delegates_to": ["agent_b"],
      "routing_rules": [{ "matcher": { "type": "always" }, "target_agent": "agent_b" }]
    },
    "agent_b": {
      "delegates_to": ["agent_a"],
      "routing_rules": [{ "matcher": { "type": "always" }, "target_agent": "agent_a" }]
    }
  }
}
```

```
Error: Circular dependency detected: "agent_a" can route to "agent_b" which can route back to "agent_a"
```

#### 2. Invalid Agent References
Verifies that all referenced agents are either builtin agents or other defined meta-agents:

```jsonc
// ❌ INVALID - Unknown agent
{
  "meta_agents": {
    "my_agent": {
      "delegates_to": ["oracle", "unknown_agent"],
      "routing_rules": [{ "matcher": { "type": "always" }, "target_agent": "unknown_agent" }]
    }
  }
}
```

```
Error: Invalid agent reference: "unknown_agent" is not a recognized agent.
Valid agents are: sisyphus, hephaestus, oracle, librarian, explore, multimodal-looker, metis, momus, atlas, prometheus
```

#### 3. Regex Performance Warnings
Analyzes regex patterns in routing rules for potential performance anti-patterns:

```jsonc
// ⚠️ WARNING - Nested quantifiers
{
  "meta_agents": {
    "my_agent": {
      "routing_rules": [{
        "matcher": {
          "type": "regex",
          "pattern": "(a+)+"  // Nested quantifier - can cause catastrophic backtracking
        },
        "target_agent": "oracle"
      }]
    }
  }
}
```

```
Warning: Regex pattern may cause performance issues: Nested quantifiers can cause catastrophic backtracking
```

### Valid Configuration Output

When your configuration is valid, you'll see:

```
📋 Validating: olimpus.jsonc

✅ Configuration is valid. No errors or warnings found.
```

### Exit Codes

- `0` - Configuration is valid
- `1` - Configuration has errors or validation failed

### Integration with Development Workflow

Add validation to your development workflow to catch configuration errors early:

```bash
# Run validation before committing
bun run olimpus validate olimpus.jsonc

# Or use in CI/CD pipelines
bun run olimpus validate olimpus.jsonc || exit 1
```

---

## Analytics

Olimpus provides a built-in analytics system that tracks routing effectiveness, agent usage patterns, and matcher performance. All data is stored locally with no external telemetry.

### What Analytics Tracks

- **Routing decisions**: Which agents get selected for each request
- **Agent usage patterns**: How frequently each agent is used
- **Matcher effectiveness**: Which matchers are firing and their success rates
- **Unmatched requests**: Requests that don't match any routing rule
- **Execution metrics**: Time taken per request and success/failure rates

### Enabling Analytics

Add the analytics configuration to your `olimpus.jsonc`:

```jsonc
{
  "settings": {
    "analytics": {
      "enabled": true,

      "storage": {
        "type": "file",
        "path": ".olimpus/analytics.json",
        "retention_days": 90
      },

      "metrics": {
        "track_routing_decisions": true,
        "track_execution_time": true,
        "track_agent_usage": true,
        "track_model_costs": true,
        "track_success_rates": true
      },

      "aggregation": {
        "enabled": true,
        "window_minutes": 60,
        "include_percentiles": true
      }
    }
  }
}
```

### Configuration Options

#### Storage

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `type` | `"memory"` \| `"file"` | `"file"` | Storage backend type |
| `path` | `string` | `".olimpus/analytics.json"` | File path for JSON storage |
| `retention_days` | `number` | `90` | Days to keep old data |

#### Metrics

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `track_routing_decisions` | `boolean` | `true` | Track agent selection |
| `track_execution_time` | `boolean` | `true` | Track request duration |
| `track_agent_usage` | `boolean` | `true` | Track usage patterns per agent |
| `track_model_costs` | `boolean` | `true` | Track token/cost metrics |
| `track_success_rates` | `boolean` | `true` | Track success/failure rates |

#### Aggregation

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable time-based aggregation |
| `window_minutes` | `number` | `60` | Time window for aggregation |
| `include_percentiles` | `boolean` | `true` | Include p50/p75/p95/p99 |

### CLI Commands

Olimpus provides CLI commands for managing analytics data:

#### Show Analytics Dashboard

Display analytics metrics and routing statistics:

```bash
# Show analytics dashboard
bun run olimpus analytics show

# Or using the direct path
./bin/olimpus.ts analytics show
```

This displays:
- Total events and routing decisions
- Unmatched requests count
- Top agents by usage
- Top matchers by effectiveness
- Date range of collected data

#### Export Analytics Data

Export analytics data in JSON or CSV format:

```bash
# Export as JSON to stdout
bun run olimpus analytics export json

# Save to file
bun run olimpus analytics export json > analytics.json

# Export as CSV to stdout
bun run olimpus analytics export csv

# Save to file
bun run olimpus analytics export csv > analytics.csv
```

##### JSON Export Format

```json
{
  "routing_decisions": [
    {
      "timestamp": "2024-01-20T10:30:00.000Z",
      "type": "routing_decision",
      "target_agent": "oracle",
      "matcher_type": "complexity",
      "matched_content": "high",
      "user_request": "Analyze the system architecture",
      "meta_agent": "atenea"
    }
  ],
  "unmatched_requests": [
    {
      "timestamp": "2024-01-20T11:00:00.000Z",
      "type": "unmatched_request",
      "user_request": "Some request that didn't match",
      "meta_agent": "atenea"
    }
  ],
  "aggregated_metrics": {
    "total_events": 150,
    "agent_usage": { "oracle": 75, "sisyphus": 50, "librarian": 25 },
    "matcher_effectiveness": {
      "complexity": { "evaluations": 100, "matches": 80 },
      "keyword": { "evaluations": 50, "matches": 35 }
    }
  }
}
```

##### CSV Export Format

```csv
timestamp,type,target_agent,matcher_type,matched_content,user_request,meta_agent
2024-01-20T10:30:00.000Z,routing_decision,oracle,complexity,high,"Analyze the system architecture",atenea
2024-01-20T11:00:00.000Z,unmatched_request,,,,,"Some request that didn't match",atenea
```

#### Clear Analytics Data

Clear all analytics data from storage:

```bash
# Clear analytics
bun run olimpus analytics clear

# Or using the direct path
./bin/olimpus.ts analytics clear
```

**Warning**: This permanently deletes all collected analytics data.

### Using Analytics Data

Analytics data helps optimize your routing configuration:

1. **Identify top agents**: See which agents are used most frequently
2. **Find unmatched requests**: Add new matchers for requests that fall through
3. **Evaluate matcher effectiveness**: Remove or adjust underperforming matchers
4. **Track success rates**: Identify agents that may need configuration tweaks

### Privacy

- All analytics data is stored **locally** on your machine
- No data is sent to external services or servers
- Storage location is configurable (default: `.olimpus/analytics.json`)
- Data retention can be configured with automatic pruning

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

## Templates

Templates are pre-configured meta-agent definitions that save you time by providing battle-tested routing configurations for common development patterns, languages, workflows, team sizes, and project domains.

### Why Use Templates?

| Benefit | Description |
|---------|-------------|
| **Immediate productivity** | Start with working configurations |
| **Best practices** | Templates follow proven patterns |
| **Reduced complexity** | No need to design routing rules from scratch |
| **Consistency** | Standardized approaches across projects |

### Available Templates

Templates are organized into four categories in the `templates/` directory:

#### 📝 Language Templates
Specialized meta-agents for programming languages and their ecosystems.

| Template | Description | Frameworks |
|----------|-------------|------------|
| [python-dev.jsonc](./templates/language/python-dev.jsonc) | Python development | Django, FastAPI, Flask, Pandas, PyTorch |
| [typescript-dev.jsonc](./templates/language/typescript-dev.jsonc) | TypeScript/JavaScript | React, Next.js, Node.js, Express |
| [rust-dev.jsonc](./templates/language/rust-dev.jsonc) | Rust development | Tokio, Actix, Axum |
| [go-dev.jsonc](./templates/language/go-dev.jsonc) | Go development | Gin, Echo, standard library |

#### 🔧 Workflow Templates
Meta-agents optimized for specific development workflows.

| Template | Description | Focus |
|----------|-------------|-------|
| [debugger.jsonc](./templates/workflow/debugger.jsonc) | Systematic debugging | Error analysis, root cause |
| [refactor.jsonc](./templates/workflow/refactor.jsonc) | Code refactoring | Code quality, patterns |
| [tdd.jsonc](./templates/workflow/tdd.jsonc) | Test-driven development | Testing, TDD |

#### 👥 Team Templates
Meta-agents optimized for different team sizes and collaboration models.

| Template | Description | Best For |
|----------|-------------|----------|
| [solo-dev.jsonc](./templates/team/solo-dev.jsonc) | Solo developer | Individual projects |
| [small-team.jsonc](./templates/team/small-team.jsonc) | Small team | Startups |
| [enterprise.jsonc](./templates/team/enterprise.jsonc) | Enterprise | Large organizations |

#### 🌐 Domain Templates
Meta-agents for specific project architectures and domains.

| Template | Description | Use Cases |
|----------|-------------|-----------|
| [monorepo.jsonc](./templates/domain/monorepo.jsonc) | Monorepo routing | Turborepo, Nx |
| [cicd.jsonc](./templates/domain/cicd.jsonc) | CI/CD workflows | GitHub Actions, GitLab CI |
| [api-first.jsonc](./templates/domain/api-first.jsonc) | API-first development | REST, GraphQL |
| [data-analysis.jsonc](./templates/domain/data-analysis.jsonc) | Data analysis | Jupyter, Pandas, ML |
| [documentation.jsonc](./templates/domain/documentation.jsonc) | Documentation | Docusaurus, MDX |
| [security-audit.jsonc](./templates/domain/security-audit.jsonc) | Security review | OWASP, auth |

### Quick Start

```bash
# Copy a template to your project root
cp templates/language/python-dev.jsonc olimpus.jsonc

# Or copy to user config
cp templates/workflow/debugger.jsonc ~/.config/opencode/olimpus.jsonc

# Validate the configuration
bun run olimpus validate olimpus.jsonc
```

### Usage

After copying a template, use the meta-agent directly:

```bash
# Use the python meta-agent
@python Create a Django model for user profiles
@python Build a FastAPI endpoint with Pydantic validation

# Use the debugger meta-agent
@debugger Debug this null pointer error
@debugger Analyze this stack trace and find the root cause
```

### Merging Multiple Templates

Combine templates from different categories for a comprehensive configuration:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",

  "meta_agents": {
    // Language template
    "python": { /* from python-dev.jsonc */ },
    // Workflow template
    "debugger": { /* from debugger.jsonc */ },
    // Domain template
    "monorepo": { /* from monorepo.jsonc */ }
  },
  "settings": {
    "max_delegation_depth": 3
  }
}
```

### Customization

After copying a template, customize it to fit your needs:

1. **Rename the meta-agent** to match your preferences
2. **Add custom routing rules** for project-specific patterns
3. **Update prompts** to match your coding standards
4. **Remove irrelevant rules** to simplify configuration

### Learn More

- **[Templates Reference](./templates/README.md)** - Complete catalog and detailed documentation
- **[Using Templates Tutorial](./docs/tutorials/06-using-templates.md)** - Step-by-step guide with examples
- **[Contributing Templates](./templates/README.md#contributing-templates)** - Submit your own templates

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

### Validate Configuration

```bash
# Validate your configuration file
bun run olimpus validate olimpus.jsonc

# Validate example configuration
bun run olimpus validate ./example/olimpus.jsonc

# Show help
bun run olimpus validate --help
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
- Validate your configuration: `bun run olimpus validate olimpus.jsonc`
- Check file syntax with `bun run typecheck`

### Validation Errors

```
Error: Circular dependency detected: atenea → hermes → atenea
Error: Invalid agent reference: "unknown_agent" is not a recognized agent
Warning: Regex pattern may cause performance issues: Nested quantifiers can cause catastrophic backtracking
```

**Solution**:
- Run `bun run olimpus validate olimpus.jsonc` to get detailed error messages
- Fix circular dependencies by removing or re-routing delegation chains
- Ensure all agent references are either builtin agents or defined meta-agents
- Consider simplifying regex patterns that trigger performance warnings

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

## Documentation

- [API Reference](./docs/API.md) - Complete API documentation
- [Tutorials](./docs/tutorials/) - Step-by-step guides for common tasks
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions
- [Migration Guide](./docs/migration.md) - Upgrading from previous versions

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
