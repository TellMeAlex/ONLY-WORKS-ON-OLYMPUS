# Advanced Patterns

**Master complex routing scenarios, circular dependency prevention, and configuration overrides.**

This tutorial covers advanced techniques for building sophisticated meta-agent configurations with circular dependency detection, dynamic configuration overrides, multi-level delegation, and routing debug capabilities.

---

## Table of Contents

- [Circular Dependency Prevention](#circular-dependency-prevention)
- [Config Overrides](#config-overrides)
- [Multi-Level Delegation](#multi-level-delegation)
- [Routing Logger](#routing-logger)
- [Advanced Matcher Combinations](#advanced-matcher-combinations)
- [Real-World Patterns](#real-world-patterns)

---

## Circular Dependency Prevention

When meta-agents can delegate to other meta-agents, there's a risk of creating infinite delegation loops. Olimpus includes circular dependency detection to prevent this.

### The Problem

Consider this scenario:

```jsonc
{
  "meta_agents": {
    "researcher": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["architect", "librarian"],
      "routing_rules": [
        {
          "matcher": { "type": "keyword", "keywords": ["design"], "mode": "any" },
          "target_agent": "architect"
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "librarian"
        }
      ]
    },
    "architect": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle"],
      "routing_rules": [
        {
          "matcher": { "type": "always" },
          "target_agent": "oracle"
        }
      ]
    }
  }
}
```

If `researcher` → `architect` → `oracle` → back to `researcher`, you get an infinite loop.

### How Detection Works

Olimpus tracks delegation chains and uses depth limits:

1. **Delegation Tracking**: Each delegation from agent A to agent B is tracked
2. **Cycle Detection**: Recursively checks if reaching an agent would create a cycle
3. **Depth Limits**: Maximum delegation depth configurable via `max_delegation_depth`

### Configuration

```jsonc
{
  "settings": {
    "max_delegation_depth": 3,
    "background_parallelization": {
      "enabled": true,
      "max_parallel_tasks": 3
    }
  }
}
```

### Safe Meta-Agent Design

Design meta-agents to avoid cycles:

```jsonc
{
  "meta_agents": {
    // Level 1: Entry point meta-agents
    "dispatcher": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["domain_researcher", "code_builder"],
      "routing_rules": [
        {
          "matcher": { "type": "keyword", "keywords": ["research", "docs"], "mode": "any" },
          "target_agent": "domain_researcher"
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "code_builder"
        }
      ]
    },

    // Level 2: Domain-specific meta-agents
    "domain_researcher": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["librarian", "oracle"],
      "routing_rules": [
        {
          "matcher": { "type": "always" },
          "target_agent": "librarian"
        }
      ]
    },

    "code_builder": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus"],
      "routing_rules": [
        {
          "matcher": { "type": "keyword", "keywords": ["test", "spec"], "mode": "any" },
          "target_agent": "sisyphus"
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

**Key Principles:**

| Principle | Description |
|-----------|-------------|
| **Hierarchical** | Organize meta-agents in levels; higher levels delegate to lower levels |
| **No Back-References** | Lower-level agents never delegate back up the hierarchy |
| **Terminal Leaves** | Ensure some chains end at built-in agents |

### Testing for Cycles

Enable routing logger to detect potential cycles during development:

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

Watch for repeated agent sequences in the logs—that's a sign of potential cycles.

---

## Config Overrides

The `config_overrides` field in routing rules allows you to dynamically customize agent behavior based on routing decisions.

### Available Override Fields

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Override the LLM model |
| `temperature` | number | Set creativity/randomness (0.0-1.0) |
| `prompt` | string | Custom system prompt |
| `variant` | string | Select agent variant (e.g., "tdd", "react", "rust") |

### Model Selection Override

Use different models based on task complexity:

```jsonc
{
  "meta_agents": {
    "smart_builder": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "sisyphus", "hephaestus"],
      "routing_rules": [
        {
          "matcher": { "type": "complexity", "threshold": "high" },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6"
          }
        },
        {
          "matcher": { "type": "complexity", "threshold": "medium" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "model": "claude-3-5-sonnet-20241022"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "hephaestus",
          "config_overrides": {
            "model": "claude-3-5-haiku-20241022"
          }
        }
      ]
    }
  }
}
```

### Temperature Override

Adjust creativity based on task type:

```jsonc
{
  "meta_agents": {
    "balanced_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "sisyphus", "atlas"],
      "routing_rules": [
        {
          // Architecture: More deterministic (lower temperature)
          "matcher": { "type": "keyword", "keywords": ["architecture", "design"], "mode": "any" },
          "target_agent": "atlas",
          "config_overrides": {
            "temperature": 0.2
          }
        },
        {
          // Brainstorming: More creative (higher temperature)
          "matcher": { "type": "keyword", "keywords": ["brainstorm", "idea"], "mode": "any" },
          "target_agent": "oracle",
          "config_overrides": {
            "temperature": 0.8
          }
        },
        {
          // Implementation: Balanced (default temperature)
          "matcher": { "type": "always" },
          "target_agent": "sisyphus"
        }
      ]
    }
  }
}
```

### Custom Prompt Override

Inject domain-specific knowledge:

```jsonc
{
  "meta_agents": {
    "domain_expert": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus"],
      "routing_rules": [
        {
          "matcher": { "type": "regex", "pattern": "\\b(TypeScript|interface|type)\\b", "flags": "i" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a TypeScript expert. Use strict types, interfaces for object shapes, and leverage TypeScript's type system for compile-time safety. Prefer union types over 'any', and use generic types for reusable components."
          }
        },
        {
          "matcher": { "type": "regex", "pattern": "\\b(React|component|hook)\\b", "flags": "i" },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a React specialist. Use functional components with hooks, implement proper dependency arrays, and follow React best practices for performance and accessibility. Use TypeScript for all components."
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "sisyphus"
        }
      ]
    }
  }
}
```

### Variant Selection

Use variant overrides to select specialized agent configurations:

```jsonc
{
  "meta_agents": {
    "adaptive_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "metis"],
      "routing_rules": [
        {
          "matcher": { "type": "keyword", "keywords": ["test", "spec", "vitest", "jest"], "mode": "any" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "tdd"
          }
        },
        {
          "matcher": { "type": "regex", "pattern": "\\b(React|Vue|component)\\b", "flags": "i" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "react"
          }
        },
        {
          "matcher": { "type": "regex", "pattern": "\\b(Rust|crate|struct|enum)\\b", "flags": "i" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "rust"
          }
        }
      ]
    }
  }
}
```

### Combining Overrides

You can combine multiple overrides in a single rule:

```jsonc
{
  "matcher": { "type": "complexity", "threshold": "high" },
  "target_agent": "oracle",
  "config_overrides": {
    "model": "claude-opus-4-6",
    "temperature": 0.3,
    "prompt": "You are analyzing a high-complexity task. Break down the problem systematically, consider edge cases, and provide a comprehensive solution."
  }
}
```

---

## Multi-Level Delegation

Multi-level delegation allows you to create chains of meta-agents that progressively narrow down task scope.

### Delegation Chain Pattern

Create a hierarchy of meta-agents:

```
Level 0: User @meta-agent
    ↓
Level 1: domain_router (decides which domain)
    ↓
Level 2: specialized_router (decides which specific agent)
    ↓
Level 3: Built-in agent (does the work)
```

### Example: Three-Level Delegation

```jsonc
{
  "meta_agents": {
    // Level 1: Domain Classifier
    "domain_classifier": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["frontend_router", "backend_router", "infra_router"],
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(frontend|web|ui|component|react|vue)\\b",
            "flags": "i"
          },
          "target_agent": "frontend_router"
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(backend|api|server|endpoint|database)\\b",
            "flags": "i"
          },
          "target_agent": "backend_router"
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(infra|devops|deploy|docker|kubernetes)\\b",
            "flags": "i"
          },
          "target_agent": "infra_router"
        }
      ]
    },

    // Level 2: Frontend Specialist
    "frontend_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "metis"],
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(test|spec|vitest|jest|cypress)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "react-testing"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["component", "feature", "ui"],
            "mode": "any"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "variant": "react"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "metis"
        }
      ]
    },

    // Level 2: Backend Specialist
    "backend_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "prometheus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["endpoint", "route", "api"],
            "mode": "any"
          },
          "target_agent": "prometheus",
          "config_overrides": {
            "variant": "api-design"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "sisyphus"
        }
      ]
    },

    // Level 2: Infrastructure Specialist
    "infra_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["atlas", "prometheus", "metis"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["architecture", "design", "system"],
            "mode": "any"
          },
          "target_agent": "atlas"
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["deploy", "pipeline", "ci/cd"],
            "mode": "any"
          },
          "target_agent": "prometheus"
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "metis"
        }
      ]
    }
  }
}
```

### Use Case Example

**User Prompt:**
```
@domain_classifier Write tests for a new React component that fetches user data from our API
```

**Routing Chain:**
1. **domain_classifier**: Matches "react" and "test" → routes to `frontend_router`
2. **frontend_router**: Matches "test" and "react" → routes to `sisyphus` with `react-testing` variant
3. **sisyphus**: Writes React component tests

### Benefits of Multi-Level Delegation

| Benefit | Description |
|---------|-------------|
| **Separation of Concerns** | Each level handles a specific decision |
| **Reusability** | Router components can be reused in different contexts |
| **Maintainability** | Easy to update one level without affecting others |
| **Scalability** | Add new domains or specializations without major refactoring |

### Anti-Pattern: Flat Delegation

Avoid having one giant meta-agent with many rules:

```jsonc
// ❌ Anti-pattern: Too many rules in one place
"mega_router": {
  "base_model": "claude-3-5-sonnet-20241022",
  "delegates_to": ["sisyphus", "oracle", "hephaestus", "atlas", "prometheus", "metis", "librarian"],
  "routing_rules": [
    { /* 50+ rules */ }
  ]
}
```

Instead, use hierarchical delegation:

```jsonc
// ✅ Better: Organized by domain
"domain_classifier": {
  "delegates_to": ["frontend_router", "backend_router", "infra_router"],
  ...
},
"frontend_router": {
  "delegates_to": ["test_router", "component_router"],
  ...
}
```

---

## Routing Logger

The routing logger provides visibility into how routing decisions are made, helping debug configuration issues.

### Configuration

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "console",
      "log_file": "routing.log",
      "debug_mode": true
    }
  }
}
```

### Configuration Fields

| Field | Type | Values | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `true`, `false` | Enable/disable routing logging |
| `output` | enum | `"console"`, `"file"`, `"disabled"` | Where to send log output |
| `log_file` | string | Path | Log file path (when output is "file") |
| `debug_mode` | boolean | `true`, `false` | Include all matcher evaluations in logs |

### Console Output

Basic mode shows only the matched route:

```json
{"timestamp":"2026-02-19T12:00:00.000Z","target_agent":"sisyphus","matcher_type":"keyword","matched_content":"matched keywords: test, spec","config_overrides":{"variant":"tdd"}}
```

### Debug Mode

Debug mode shows all evaluated matchers:

```json
{
  "timestamp": "2026-02-19T12:00:00.000Z",
  "target_agent": "sisyphus",
  "matcher_type": "keyword",
  "matched_content": "matched keywords: test, spec",
  "config_overrides": {
    "variant": "tdd"
  },
  "debug_info": {
    "all_evaluated": [
      {
        "matcher_type": "complexity",
        "matcher": {
          "type": "complexity",
          "threshold": "high"
        },
        "matched": false
      },
      {
        "matcher_type": "keyword",
        "matcher": {
          "type": "keyword",
          "keywords": ["test", "spec", "vitest"],
          "mode": "any"
        },
        "matched": true
      },
      {
        "matcher_type": "always",
        "matcher": {
          "type": "always"
        },
        "matched": true
      }
    ],
    "total_evaluated": 3
  }
}
```

### File Output

Log to a file for analysis:

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "file",
      "log_file": "logs/routing.log",
      "debug_mode": false
    }
  }
}
```

### Analyzing Routing Logs

1. **Find non-matching routes**:
   ```bash
   grep '"target_agent":null' logs/routing.log
   ```

2. **Find routes to specific agents**:
   ```bash
   grep '"target_agent":"oracle"' logs/routing.log
   ```

3. **Find matches by matcher type**:
   ```bash
   grep '"matcher_type":"regex"' logs/routing.log
   ```

### Troubleshooting with Logger

| Symptom | Logger Investigation | Solution |
|----------|---------------------|-----------|
| Wrong agent selected | Check `debug_info.all_evaluated` | Adjust rule order or matcher patterns |
| No matches found | Look for entries with null target | Add `always` matcher as fallback |
| Regex not matching | Check regex pattern in logs | Fix syntax or add flags |
| Keywords not matching | Check `matched_content` | Verify case sensitivity and spelling |

---

## Advanced Matcher Combinations

Combine different matcher types for sophisticated routing logic.

### Hierarchical Match Strategy

Start specific, go broad:

```jsonc
{
  "routing_rules": [
    // 1. Most specific: Keyword + Project context
    {
      "matcher": {
        "type": "project_context",
        "has_files": ["packages/web/package.json"],
        "has_deps": ["react", "@testing-library/react"]
      },
      "target_agent": "sisyphus",
      "config_overrides": {
        "variant": "react-testing"
      }
    },
    // 2. Medium specific: Regex on prompt
    {
      "matcher": {
        "type": "regex",
        "pattern": "\\b(test|spec)\\b",
        "flags": "i"
      },
      "target_agent": "sisyphus"
    },
    // 3. Least specific: Complexity
    {
      "matcher": {
        "type": "complexity",
        "threshold": "high"
      },
      "target_agent": "oracle"
    },
    // 4. Fallback
    {
      "matcher": { "type": "always" },
      "target_agent": "hephaestus"
    }
  ]
}
```

### Pattern: Language + Complexity

Route based on both language and task complexity:

```jsonc
{
  "meta_agents": {
    "language_complexity_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "metis"],
      "routing_rules": [
        // High complexity Python
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(python|django|fastapi)\\b.*\\b(architecture|design|scal)\\b",
            "flags": "i"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6",
            "variant": "python-architecture"
          }
        },
        // Simple Python
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(python|py\\.)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "python"
          }
        },
        // High complexity TypeScript
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(typescript|ts)\\b.*\\b(architecture|design|scal)\\b",
            "flags": "i"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6",
            "variant": "typescript-architecture"
          }
        },
        // Simple TypeScript
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(typescript|ts)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "typescript"
          }
        }
      ]
    }
  }
}
```

### Pattern: Task Type + Project Context

Combine task detection with project structure:

```jsonc
{
  "meta_agents": {
    "context_aware_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "atlas"],
      "routing_rules": [
        // Testing in React project
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "vitest"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "This is a React project. Use @testing-library/react for component testing and Vitest as the test runner. Test user behavior, not implementation details."
          }
        },
        // Components in React project (detected via context)
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["package.json"],
            "has_deps": ["react"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "This is a React project. Use functional components with hooks, TypeScript for typing, and follow React best practices."
          }
        },
        // General fallback
        {
          "matcher": { "type": "always" },
          "target_agent": "metis"
        }
      ]
    }
  }
}
```

---

## Real-World Patterns

### Pattern 1: Progressive Enhancement

Start simple, enhance as needed:

```jsonc
{
  "meta_agents": {
    "progressive_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["metis", "sisyphus", "oracle"],
      "routing_rules": [
        // Level 1: Quick tasks
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["quick", "simple", "small"],
            "mode": "any"
          },
          "target_agent": "metis"
        },
        // Level 2: Standard implementation
        {
          "matcher": { "type": "complexity", "threshold": "low" },
          "target_agent": "sisyphus"
        },
        // Level 3: Complex analysis
        {
          "matcher": { "type": "complexity", "threshold": "medium" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "This is a medium-complexity task. Consider multiple approaches and explain trade-offs."
          }
        },
        // Level 4: Expert intervention
        {
          "matcher": { "type": "complexity", "threshold": "high" },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6"
          }
        }
      ]
    }
  }
}
```

### Pattern 2: Cost Optimization

Use cheaper models for simple tasks, expensive for complex ones:

```jsonc
{
  "meta_agents": {
    "cost_optimizer": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "sisyphus", "metis"],
      "routing_rules": [
        // Expensive model for high complexity
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6"
          }
        },
        // Cheap model for simple tasks
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["explain", "describe", "what is"],
            "mode": "any"
          },
          "target_agent": "metis",
          "config_overrides": {
            "model": "claude-3-5-haiku-20241022"
          }
        },
        // Standard model for implementation
        {
          "matcher": { "type": "always" },
          "target_agent": "sisyphus",
          "config_overrides": {
            "model": "claude-3-5-sonnet-20241022"
          }
        }
      ]
    }
  }
}
```

### Pattern 3: Task Lifecycle Routing

Route based on task lifecycle stage:

```jsonc
{
  "meta_agents": {
    "lifecycle_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "atlas", "sisyphus", "metis"],
      "routing_rules": [
        // Planning phase
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["plan", "design", "architecture", "spec"],
            "mode": "any"
          },
          "target_agent": "atlas"
        },
        // Research phase
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["research", "docs", "documentation", "find"],
            "mode": "any"
          },
          "target_agent": "oracle"
        },
        // Implementation phase
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["implement", "write", "create", "build"],
            "mode": "any"
          },
          "target_agent": "sisyphus"
        },
        // Testing phase
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "verify", "validate"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "tdd"
          }
        },
        // Debugging phase
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["debug", "fix", "error", "issue"],
            "mode": "any"
          },
          "target_agent": "metis"
        }
      ]
    }
  }
}
```

### Pattern 4: Context-Aware Adaptation

Adapt behavior based on project context:

```jsonc
{
  "meta_agents": {
    "adaptive_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus"],
      "routing_rules": [
        // Legacy codebase (older dependencies)
        {
          "matcher": {
            "type": "project_context",
            "has_deps": ["react@15", "lodash@3", "jquery"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "This is a legacy codebase. Be conservative with changes, ensure backward compatibility, and avoid introducing breaking changes. Maintain existing patterns where possible."
          }
        },
        // Modern codebase (current dependencies)
        {
          "matcher": {
            "type": "project_context",
            "has_deps": ["react@18", "next", "typescript"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "This is a modern codebase. Use current best practices, leverage modern APIs, and prefer built-in browser features over polyfills."
          }
        },
        // Unknown context - ask first
        {
          "matcher": { "type": "always" },
          "target_agent": "metis"
        }
      ]
    }
  }
}
```

---

## Next Steps

- **[Quickstart Tutorial](01-quickstart.md)** - Get started with Olimpus basics
- **[Monorepo Routing](02-monorepo-routing.md)** - Routing in monorepo setups
- **[Team Workflows](03-team-workflows.md)** - Multi-team collaboration
- **[Language-Specific Routing](04-language-specific-routing.md)** - Language-based routing
- **[Schema Reference](../SCHEMA.md)** - Complete configuration schema

---

## See Also

- [GitHub Repository](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS)
- [oh-my-opencode Documentation](https://github.com/code-yeongyu/oh-my-opencode)
