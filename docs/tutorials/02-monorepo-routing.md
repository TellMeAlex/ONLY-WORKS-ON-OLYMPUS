# Monorepo Routing

**Intelligent task routing across multiple packages in a monorepo.**

This tutorial teaches you how to configure Olimpus to intelligently route tasks to the right package and agent in a monorepo architecture.

---

## Table of Contents

- [What is Monorepo Routing?](#what-is-monorepo-routing)
- [When to Use](#when-to-use)
- [Monorepo Structure Example](#monorepo-structure-example)
- [Package-Aware Routing](#package-aware-routing)
- [Language-Based Routing](#language-based-routing)
- [Cross-Package Coordination](#cross-package-coordination)
- [Advanced Patterns](#advanced-patterns)
- [Common Scenarios](#common-scenarios)

---

## What is Monorepo Routing?

Monorepo routing extends Olimpus's intelligent routing to handle the complexity of multi-package projects. Instead of just choosing which agent to use, routing decisions also consider:

1. **Package Context** - Which package in the monorepo is being affected
2. **Language/Runtime** - Different packages may use different languages
3. **Shared Dependencies** - Detect changes that affect multiple packages
4. **Build System** - Turbo, Nx, or custom build configurations

### Benefits

| Benefit | Description |
|---------|-------------|
| **Automatic Package Selection** | Tasks route to the correct package automatically |
| **Language-Aware** | Uses appropriate tools per package (TypeScript vs Rust) |
| **Change Impact Analysis** | Detects which packages are affected by changes |
| **Unified Configuration** | Single `olimpus.jsonc` for entire monorepo |

---

## When to Use

Monorepo routing is valuable when your project:

- Has **multiple packages** in different directories
- Uses **different languages** or frameworks per package
- Requires **coordinated changes** across packages
- Uses **workspaces** (npm, pnpm, yarn workspaces)
- Has **shared libraries** used by multiple packages

---

## Monorepo Structure Example

Consider this typical monorepo:

```
my-monorepo/
├── packages/
│   ├── web/              # React/TypeScript frontend
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/              # Node.js/Express backend
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── core/             # Shared TypeScript library
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/              # Rust CLI tool
│       ├── Cargo.toml
│       └── src/
├── package.json          # Workspace root
├── turbo.json            # Turborepo config
└── olimpus.jsonc         # Olimpus configuration
```

---

## Package-Aware Routing

Use the **project context matcher** to route based on which package is being modified.

### Basic Package Detection

```jsonc
{
  "meta_agents": {
    "web_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle"],
      "routing_rules": [
        {
          // Detect when working in packages/web
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/web/package.json"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a React/TypeScript frontend specialist. Build responsive, accessible components.",
            "variant": "react"
          }
        }
      ]
    }
  }
}
```

### Multi-Package Router

```jsonc
{
  "meta_agents": {
    "monorepo_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle", "atlas"],

      "routing_rules": [
        // Frontend package routes
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/web/package.json"],
            "has_deps": ["react", "@vitejs/plugin-react"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "React frontend specialist. Build with TypeScript, hooks, and Vite.",
            "variant": "react"
          }
        },

        // Backend API routes
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/api/package.json"],
            "has_deps": ["express", "fastify"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Node.js API specialist. Build REST endpoints with Express/Fastify.",
            "variant": "nodejs"
          }
        },

        // Shared core library routes
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/core/package.json"]
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Core library architect. Design abstractions used by multiple packages.",
            "variant": "core"
          }
        },

        // Rust CLI routes
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/cli/Cargo.toml"]
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "Rust CLI specialist. Build fast, safe command-line tools.",
            "variant": "rust"
          }
        },

        // Fallback for workspace root
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "metis"
        }
      ]
    }
  }
}
```

---

## Language-Based Routing

Use **regex matchers** to detect language-specific patterns in prompts and route accordingly.

### Framework Detection

```jsonc
{
  "meta_agents": {
    "language_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle"],

      "routing_rules": [
        // React/TypeScript
        {
          "matcher": {
            "type": "regex",
            "pattern": "(react|component|hook|useEffect|useState)",
            "flags": "i"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "React specialist. Use TypeScript, hooks, and modern patterns.",
            "variant": "react"
          }
        },

        // Rust
        {
          "matcher": {
            "type": "regex",
            "pattern": "(rust|cargo|struct|enum|impl|crate)",
            "flags": "i"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Rust specialist. Focus on safety, performance, and idiomatic patterns.",
            "variant": "rust"
          }
        },

        // Node.js/Express
        {
          "matcher": {
            "type": "regex",
            "pattern": "(express|fastify|route|middleware|endpoint)",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Node.js API specialist. Build with Express/Fastify and TypeScript.",
            "variant": "nodejs"
          }
        },

        // Testing
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "vitest", "jest"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "TDD specialist. Write tests first, then implementation.",
            "variant": "tdd"
          }
        }
      ]
    }
  }
}
```

### Combined Context + Language

For maximum accuracy, combine project context with language detection:

```jsonc
{
  "meta_agents": {
    "smart_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle", "metis"],

      "routing_rules": [
        // React component in web package
        {
          "matcher": {
            "type": "regex",
            "pattern": "component.*react|react.*component",
            "flags": "i"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "Build a React component with TypeScript and proper typing.",
            "variant": "react-component"
          }
        },

        // React tests in web package
        {
          "matcher": {
            "type": "regex",
            "pattern": "test.*react|react.*test|vitest.*component",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Write React component tests using Testing Library and Vitest.",
            "variant": "react-testing"
          }
        },

        // API endpoint changes
        {
          "matcher": {
            "type": "regex",
            "pattern": "(endpoint|route|api).*(add|create|update)",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Add an API endpoint with proper error handling and validation.",
            "variant": "api-endpoint"
          }
        }
      ]
    }
  }
}
```

---

## Cross-Package Coordination

Monorepos often require changes that affect multiple packages. Use complexity matchers to detect these scenarios.

### Detecting Cross-Package Changes

```jsonc
{
  "meta_agents": {
    "coordinator": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "prometheus", "atlas", "metis"],

      "routing_rules": [
        // High complexity - likely cross-package or architectural
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Architect: Analyze how this change affects multiple packages. Propose a coordinated approach.",
            "variant": "cross-package"
          }
        },

        // Medium complexity - may involve multiple files
        {
          "matcher": {
            "type": "complexity",
            "threshold": "medium"
          },
          "target_agent": "prometheus",
          "config_overrides": {
            "prompt": "Strategist: Plan implementation considering package dependencies and build system.",
            "variant": "multi-file"
          }
        },

        // Simple changes - single package
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "metis"
        }
      ]
    }
  }
}
```

### Shared Library Changes

When working with shared libraries, detect changes that require version bumps across dependents:

```jsonc
{
  "meta_agents": {
    "shared_lib_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "atlas"],

      "routing_rules": [
        // Detect core library changes
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["packages/core", "core library", "shared types"],
            "mode": "any"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Core library architect. Identify which packages depend on this module and plan coordinated updates.",
            "variant": "shared-lib"
          }
        },

        // Detect type changes that ripple across packages
        {
          "matcher": {
            "type": "regex",
            "pattern": "(type|interface|enum).*(change|update|modify)",
            "flags": "i"
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "System designer: This type change may affect multiple packages. Plan the migration strategy.",
            "variant": "type-migration"
          }
        }
      ]
    }
  }
}
```

---

## Advanced Patterns

### Workspace-Aware Routing

For npm/pnpm/yarn workspaces, detect the active workspace directory:

```jsonc
{
  "meta_agents": {
    "workspace_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle"],

      "routing_rules": [
        // Detect workspace configuration
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["pnpm-workspace.yaml", "package.json"]
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You're in a pnpm workspace. Consider package dependencies and workspace protocol.",
            "variant": "pnpm-workspace"
          }
        },

        // Detect Turborepo
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["turbo.json"]
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "Turborepo specialist. Consider task dependencies and caching strategies.",
            "variant": "turborepo"
          }
        },

        // Detect Nx
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["nx.json", "project.json"]
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "Nx specialist. Consider affected project graph and generators.",
            "variant": "nx"
          }
        }
      ]
    }
  }
}
```

### Package-Specific Testing Strategies

Different packages may have different testing requirements:

```jsonc
{
  "meta_agents": {
    "testing_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "metis"],

      "routing_rules": [
        // React component testing
        {
          "matcher": {
            "type": "regex",
            "pattern": "packages/web.*test|test.*packages/web",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "React testing specialist. Use @testing-library/react and Vitest. Test user behavior, not implementation.",
            "variant": "react-testing"
          }
        },

        // API endpoint testing
        {
          "matcher": {
            "type": "regex",
            "pattern": "packages/api.*test|test.*packages/api",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "API testing specialist. Use supertest or fastify inject. Test endpoints, status codes, and responses.",
            "variant": "api-testing"
          }
        },

        // Core library testing
        {
          "matcher": {
            "type": "regex",
            "pattern": "packages/core.*test|test.*packages/core",
            "flags": "i"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "Unit testing specialist. Focus on pure functions, edge cases, and type safety.",
            "variant": "unit-testing"
          }
        }
      ]
    }
  }
}
```

### Multi-Language Build System

For monorepos with multiple languages, route build-related tasks:

```jsonc
{
  "meta_agents": {
    "build_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["atlas", "prometheus", "sisyphus"],

      "routing_rules": [
        // TypeScript compilation issues
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["typescript error", "ts error", "type error"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "TypeScript specialist. Fix type errors while maintaining type safety.",
            "variant": "typescript-fix"
          }
        },

        // Build system configuration
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["turbo", "nx", "build config", "pipeline"],
            "mode": "any"
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "Build system architect. Optimize build configuration for cache hits and parallelism.",
            "variant": "build-config"
          }
        },

        // Dependency updates
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["dependency", "npm", "pnpm", "yarn", "upgrade"],
            "mode": "any"
          },
          "target_agent": "prometheus",
          "config_overrides": {
            "prompt": "Dependency strategist. Consider workspace protocols, lockfile updates, and breaking changes.",
            "variant": "dependency-update"
          }
        }
      ]
    }
  }
}
```

---

## Common Scenarios

### Scenario 1: Adding a Feature to the Frontend Package

**Prompt:**
```
@monorepo_router Add a user profile card component to the web package
```

**Routing:**
1. Regex matcher detects "component"
2. Routes to `hephaestus` with `react` variant
3. Agent builds component in `packages/web/src/components/`

### Scenario 2: Creating a New API Endpoint

**Prompt:**
```
@monorepo_router Create a DELETE /api/users/:id endpoint in the API package
```

**Routing:**
1. Regex matcher detects "endpoint" and "api"
2. Project context matcher detects `packages/api/package.json`
3. Routes to `sisyphus` with `nodejs` variant
4. Agent adds route in `packages/api/src/routes/users.ts`

### Scenario 3: Updating Shared Types

**Prompt:**
```
@monorepo_router Update the User interface to include a phoneNumber field
```

**Routing:**
1. Complexity matcher detects this as `high` (affects multiple packages)
2. Routes to `oracle` with `shared-lib` variant
3. Agent identifies dependent packages and plans coordinated update

### Scenario 4: Debugging a TypeScript Error

**Prompt:**
```
@monorepo_router Fix the TypeScript error in the core package's user types
```

**Routing:**
1. Keyword matcher detects "typescript error"
2. Routes to `sisyphus` with `typescript-fix` variant
3. Agent fixes type error in `packages/core/src/types/user.ts`

### Scenario 5: Running Tests Across Packages

**Prompt:**
```
@monorepo_router Add tests for the new authentication middleware in the API package
```

**Routing:**
1. Regex matcher detects "test" and "api"
2. Routes to `sisyphus` with `api-testing` variant
3. Agent writes tests in `packages/api/tests/middleware/auth.test.ts`

---

## Best Practices

### 1. Use Hierarchical Routing

Start with broad matchers (package context), then narrow down with specific patterns:

```jsonc
{
  "routing_rules": [
    // Broad: Package detection
    { "matcher": { "type": "project_context", "has_files": ["packages/web"] }, ... },
    // Narrow: Specific task within package
    { "matcher": { "type": "regex", "pattern": "test.*component" }, ... },
    // Fallback
    { "matcher": { "type": "always" }, ... }
  ]
}
```

### 2. Leverage Complexity Scores

Use complexity matchers for tasks that likely span multiple packages:

```jsonc
{
  "matcher": { "type": "complexity", "threshold": "high" },
  "target_agent": "oracle"
}
```

### 3. Combine Matchers for Precision

Combine project context with language detection:

```jsonc
{
  "matcher": {
    "type": "regex",
    "pattern": "(component|hook).*test"
  },
  "config_overrides": {
    "variant": "react-component-test"
  }
}
```

### 4. Enable Debug Logging

When configuring monorepo routing, enable debug logging to understand routing decisions:

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

## Troubleshooting

### Task routes to wrong package

**Problem:** Tasks are being routed to the wrong package directory.

**Solutions:**
1. Check rule order—broader matchers should come first
2. Verify file paths in `project_context` matchers
3. Use regex patterns for more precise matching

### Cross-package changes not detected

**Problem:** Changes affecting multiple packages aren't routed to coordination agents.

**Solutions:**
1. Increase `complexity` threshold in matchers
2. Add keywords for "shared", "multiple", "packages"
3. Use `always` matcher as a fallback for complex tasks

### Language-specific tools not being used

**Problem:** Agent isn't using the right tools for the package language.

**Solutions:**
1. Set appropriate `variant` in `config_overrides`
2. Include language-specific keywords in prompts
3. Verify language detection patterns match your codebase

---

## Next Steps

- **[Quickstart Tutorial](01-quickstart.md)** - Get started with Olimpus basics
- **[API Reference](../API.md)** - Complete TypeScript API documentation
- **[Schema Reference](../SCHEMA.md)** - JSON Schema for configuration
- **[Configuration Example](../../example/olimpus.jsonc)** - Full example configuration

---

## See Also

- [GitHub Repository](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS)
- [oh-my-opencode Documentation](https://github.com/code-yeongyu/oh-my-opencode)
- [Turborepo Documentation](https://turbo.build/repo)
- [Nx Documentation](https://nx.dev)
