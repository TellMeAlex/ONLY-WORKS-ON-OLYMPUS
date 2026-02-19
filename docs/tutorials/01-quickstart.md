# Quickstart Tutorial

**Get up and running with Olimpus in 5 minutes.**

This tutorial will guide you through installing Olimpus, creating your first configuration, and routing tasks intelligently to specialized agents.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Your First Configuration](#your-first-configuration)
- [Understanding Meta-Agents](#understanding-meta-agents)
- [Routing Rules](#routing-rules)
- [Try It Out](#try-it-out)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** or **Bun** installed
- **oh-my-opencode** installed and configured
- An Anthropic API key (or compatible LLM provider)

---

## Installation

Install Olimpus as a plugin for oh-my-opencode:

```bash
npm install olimpus-plugin
# or
bun install olimpus-plugin
```

---

## Your First Configuration

Create a file named `olimpus.jsonc` in your project root:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",

  // ============================================================================
  // META_AGENTS
  // ============================================================================
  // Define custom meta-agents that route to specialized oh-my-opencode agents

  "meta_agents": {
    // Example: Research specialist
    "researcher": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["librarian", "oracle"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["docs", "documentation", "search"],
            "mode": "any"
          },
          "target_agent": "librarian"
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "oracle"
        }
      ]
    },

    // Example: Implementation specialist
    "builder": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["package.json"],
            "has_deps": ["vitest", "jest", "bun:test"]
          },
          "target_agent": "sisyphus"
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "hephaestus"
        }
      ]
    }
  },

  // ============================================================================
  // SETTINGS
  // ============================================================================
  // Olimpus-specific configuration

  "settings": {
    "max_delegation_depth": 3,
    "background_parallelization": {
      "enabled": true,
      "max_parallel_tasks": 3
    }
  }
}
```

---

## Understanding Meta-Agents

A **meta-agent** is a router that intelligently delegates tasks to specialized agents. Think of it as a dispatcher that analyzes your request and routes it to the most appropriate worker.

### Key Components

| Component | Description |
|-----------|-------------|
| `base_model` | The default LLM model for this meta-agent |
| `delegates_to` | List of agents this meta-agent can route to |
| `routing_rules` | Ordered rules that determine which agent to use |

---

## Routing Rules

Routing rules determine how requests are matched to agents. Rules are evaluated in order, and the **first match wins**.

### Available Matchers

#### 1. **Keyword Matcher** - Matches keywords in your prompt

```jsonc
{
  "matcher": {
    "type": "keyword",
    "keywords": ["bug", "error", "fix"],
    "mode": "any"  // "any" = OR logic, "all" = AND logic
  },
  "target_agent": "oracle"
}
```

#### 2. **Complexity Matcher** - Routes based on request complexity

```jsonc
{
  "matcher": {
    "type": "complexity",
    "threshold": "high"  // "low", "medium", or "high"
  },
  "target_agent": "oracle"
}
```

#### 3. **Regex Matcher** - Uses regular expressions

```jsonc
{
  "matcher": {
    "type": "regex",
    "pattern": "^(test|spec)",
    "flags": "i"  // Case-insensitive
  },
  "target_agent": "sisyphus"
}
```

#### 4. **Project Context Matcher** - Routes based on project structure

```jsonc
{
  "matcher": {
    "type": "project_context",
    "has_files": ["package.json"],
    "has_deps": ["vitest", "jest"]
  },
  "target_agent": "sisyphus"
}
```

#### 5. **Always Matcher** - Catch-all fallback

```jsonc
{
  "matcher": {
    "type": "always"
  },
  "target_agent": "hephaestus"
}
```

---

## Try It Out

With your configuration in place, try these example prompts:

### Research Tasks

```
@researcher Find documentation about React hooks
```
→ Routes to **librarian** (keyword matcher matched "documentation")

### Complex Architecture

```
@researcher Design a scalable microservices architecture with event sourcing
```
→ Routes to **oracle** (complexity matcher detects "high" complexity)

### Testing Tasks

```
@builder Write tests for the authentication module
```
→ Routes to **sisyphus** (regex matcher detects "test" keyword)

### General Implementation

```
@builder Create a user profile component
```
→ Routes to **hephaestus** (no specific rules matched, uses always fallback)

---

## Ultrawork Mode

For relentless execution mode, include "ulw" or "ultrawork" in your prompt:

```
ulw @builder implement a complete authentication system with OAuth, tests, and documentation
```

This enables:
- **Background parallelization**: Fires research tasks while building
- **Multi-model optimization**: Uses cheap models for search, expensive for decisions
- **Todo continuation**: Tasks don't stop halfway
- **Verification**: Double-checks work before declaring done

---

## Built-in Agents

Olimpus can route to these built-in oh-my-opencode agents:

| Agent | Purpose |
|-------|---------|
| `sisyphus` | TDD-focused implementation |
| `oracle` | Strategic architecture analysis |
| `librarian` | Documentation and research |
| `explore` | Code exploration |
| `metis` | General technical analysis |
| `atlas` | System design |
| `prometheus` | Technical strategy |
| `hephaestus` | General building |

---

## Next Steps

Now that you have Olimpus running, explore more advanced topics:

- **[API Reference](../API.md)** - Complete TypeScript API documentation
- **[Schema Reference](../SCHEMA.md)** - JSON Schema for configuration
- **[Real-World Examples](02-monorepo-routing.md)** - Tutorial on monorepo routing
- **[Configuration Example](../../example/olimpus.jsonc)** - Full example configuration

---

## Common Issues

### Configuration not loading

Ensure your `olimpus.jsonc` file is valid JSON with comments enabled. The `$schema` field is optional but recommended for IDE validation.

### Routing not working as expected

1. Check rule order—first match wins
2. Verify the `target_agent` is a valid built-in agent
3. Enable routing logging for debugging:

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "console",
      "debug_mode": true
    }
  }
}
```

---

## See Also

- [GitHub Repository](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS)
- [oh-my-opencode Documentation](https://github.com/code-yeongyu/oh-my-opencode)
