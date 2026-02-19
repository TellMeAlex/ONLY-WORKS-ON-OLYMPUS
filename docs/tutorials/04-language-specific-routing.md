# Language-Specific Routing

**Route tasks to agents based on programming language context.**

This tutorial shows how to configure Olimpus to intelligently route requests to specialized agents based on the programming language, framework, or technology stack you're working with.

---

## Table of Contents

- [Overview](#overview)
- [Approaches to Language Detection](#approaches-to-language-detection)
- [Regex-Based Language Routing](#regex-based-language-routing)
- [Project Context Routing](#project-context-routing)
- [Combined Detection Strategies](#combined-detection-strategies)
- [Language-Specialized Meta-Agents](#language-specialized-meta-agents)
- [Real-World Examples](#real-world-examples)
- [Debugging Language Routing](#debugging-language-routing)

---

## Overview

Language-specific routing allows you to:

- **Delegate to specialists**: Route TypeScript, Python, Go, Rust, or other language tasks to appropriately configured agents
- **Language-aware prompts**: Provide language-specific context and best practices
- **Optimize model selection**: Use different LLM models for different languages based on their training
- **Tool selection**: Enable language-specific tools and frameworks

---

## Approaches to Language Detection

Olimpus provides multiple ways to detect the programming language context:

| Approach | Matcher Type | Best For |
|----------|--------------|----------|
| **Regex matching** | `regex` | Language keywords in prompts (e.g., "Python function", "TypeScript interface") |
| **Keyword matching** | `keyword` | Explicit language mentions |
| **Project context** | `project_context` | Detecting language via files and dependencies |
| **Combined** | Multiple matchers | Robust detection across scenarios |

---

## Regex-Based Language Routing

The regex matcher is ideal for detecting language keywords in user prompts.

### Basic Language Detection

```jsonc
{
  "meta_agents": {
    "polyglot": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "metis"],

      "routing_rules": [
        {
          // Match TypeScript/JavaScript prompts
          "matcher": {
            "type": "regex",
            "pattern": "\\b(TypeScript|JavaScript|JS|TS|React|Node\\.js)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a TypeScript/JavaScript specialist. Use modern ES6+ syntax, prefer async/await, and follow TypeScript best practices including strict typing."
          }
        },
        {
          // Match Python prompts
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Python|py\\.|Django|Flask|FastAPI|async def|@dataclass)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Python specialist. Follow PEP 8 style guide, prefer type hints (PEP 484), and use async/await for I/O operations."
          }
        },
        {
          // Match Go prompts
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Golang|Go\\.|\\bgo\\b|goroutine|chan\\s|interface\\{\\})",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Go specialist. Follow effective Go patterns, prefer composition over inheritance, and handle errors explicitly."
          }
        },
        {
          // Match Rust prompts
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Rust|rustc|Cargo|\\bfn\\s|\\blifetime|\\bimpl\\s|Borrow)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Rust specialist. Follow the Rust API guidelines, use idiomatic error handling with Result types, and respect ownership and borrowing rules."
          }
        },
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

### Framework-Specific Routing

```jsonc
{
  "meta_agents": {
    "web_framework_specialist": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "oracle"],
      "routing_rules": [
        {
          // React/Next.js
          "matcher": {
            "type": "regex",
            "pattern": "\\b(React|Next\\.js|useEffect|useCallback|\\buseState|NextAuth)\\b",
            "flags": "i"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a React specialist. Use functional components with hooks, implement proper dependency arrays, and follow React best practices for performance and accessibility."
          }
        },
        {
          // Vue/Nuxt.js
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Vue|Nuxt|v-bind|v-if|computed|ref)\\b",
            "flags": "i"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a Vue specialist. Use Composition API, implement proper reactivity, and follow Vue style guide conventions."
          }
        },
        {
          // Django
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Django|models\\.Model|@csrf_exempt|QuerySet|class\\s.*\\(View\\))",
            "flags": "i"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a Django specialist. Follow Django best practices, use class-based views, and implement proper ORM queries with select_related/prefetch_related."
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "hephaestus"
        }
      ]
    }
  }
}
```

---

## Project Context Routing

The project_context matcher detects languages based on files and dependencies in your project.

### Language Detection via File Patterns

```jsonc
{
  "meta_agents": {
    "project_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle"],
      "routing_rules": [
        {
          // Python project
          "matcher": {
            "type": "project_context",
            "has_files": ["pyproject.toml", "requirements.txt", "setup.py"],
            "has_deps": ["django", "flask", "fastapi", "pytest", "numpy"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are working in a Python project. Follow PEP 8, use type hints, and ensure proper package structure.",
            "variant": "python"
          }
        },
        {
          // TypeScript project
          "matcher": {
            "type": "project_context",
            "has_files": ["tsconfig.json", "package.json"],
            "has_deps": ["typescript", "react", "vue", "@types/"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are working in a TypeScript project. Use strict types, interfaces for object shapes, and leverage the type system.",
            "variant": "typescript"
          }
        },
        {
          // Go project
          "matcher": {
            "type": "project_context",
            "has_files": ["go.mod", "go.sum", "main.go"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are working in a Go project. Follow Go conventions, use effective Go patterns, and handle errors explicitly.",
            "variant": "go"
          }
        },
        {
          // Rust project
          "matcher": {
            "type": "project_context",
            "has_files": ["Cargo.toml", "Cargo.lock", "src/main.rs"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are working in a Rust project. Follow Rust idioms, use proper ownership, and implement idiomatic error handling.",
            "variant": "rust"
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "hephaestus"
        }
      ]
    }
  }
}
```

---

## Combined Detection Strategies

For robust language detection, combine regex and project_context matchers.

### Hierarchical Detection

```jsonc
{
  "meta_agents": {
    "smart_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "metis"],

      "routing_rules": [
        // Priority 1: Explicit language in prompt (regex)
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(TypeScript|JavaScript|React)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "TypeScript specialist context...",
            "variant": "typescript"
          }
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Python|Django|FastAPI)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Python specialist context...",
            "variant": "python"
          }
        },

        // Priority 2: Project structure detection
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["tsconfig.json"],
            "has_deps": ["typescript"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "TypeScript project context...",
            "variant": "typescript"
          }
        },
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["pyproject.toml"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Python project context...",
            "variant": "python"
          }
        },

        // Priority 3: General fallback
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

## Language-Specialized Meta-Agents

Create dedicated meta-agents for each language ecosystem:

```jsonc
{
  "meta_agents": {
    // TypeScript Specialist
    "ts_expert": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "atlas"],
      "temperature": 0.3,
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(test|spec|unit|integration)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a TypeScript testing expert. Use Vitest or Jest, ensure proper type coverage, and follow testing best practices.",
            "variant": "tdd"
          }
        },
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a TypeScript architecture expert. Design scalable type systems, consider runtime vs compile-time trade-offs, and follow SOLID principles."
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a TypeScript specialist. Write idiomatic code with proper types, use modern ES features, and follow TypeScript best practices."
          }
        }
      ]
    },

    // Python Specialist
    "py_expert": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "atlas"],
      "temperature": 0.3,
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(test|pytest|unittest|spec)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Python testing expert. Use pytest with fixtures, ensure proper mocking, and follow pytest conventions.",
            "variant": "tdd"
          }
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(Django|Flask|FastAPI)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Python web framework specialist. Follow framework conventions, implement proper middleware, and handle web-specific patterns."
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Python specialist. Follow PEP 8, use type hints, write docstrings, and leverage Python's standard library."
          }
        }
      ]
    },

    // Go Specialist
    "go_expert": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "atlas"],
      "temperature": 0.3,
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(test|_test\\.go|benchmark|benchmark)\\b",
            "flags": "i"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Go testing expert. Use table-driven tests, proper test organization, and use testing package conventions.",
            "variant": "tdd"
          }
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(concurrent|goroutine|channel|sync\\.)\\b",
            "flags": "i"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a Go concurrency expert. Use proper synchronization patterns, avoid race conditions, and follow Go concurrency idioms."
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Go specialist. Follow effective Go, use proper error handling, and respect Go's simplicity philosophy."
          }
        }
      ]
    }
  }
}
```

---

## Real-World Examples

### Example 1: Polyglot Monorepo

For a monorepo with multiple languages, create separate meta-agents:

```jsonc
{
  "meta_agents": {
    "monorepo_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["ts_expert", "py_expert", "go_expert", "metis"],
      "routing_rules": [
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(packages/frontend|web|ui|react)\\b",
            "flags": "i"
          },
          "target_agent": "ts_expert"
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(services/api|backend|python)\\b",
            "flags": "i"
          },
          "target_agent": "py_expert"
        },
        {
          "matcher": {
            "type": "regex",
            "pattern": "\\b(services/internal|infra|golang)\\b",
            "flags": "i"
          },
          "target_agent": "go_expert"
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "This appears to be a cross-language request. Analyze the context and route to the appropriate language specialist or provide general advice."
          }
        }
      ]
    }
  }
}
```

### Example 2: Language Model Selection

Configure different models for different languages:

```jsonc
{
  "meta_agents": {
    "python_router": {
      "base_model": "claude-3-5-sonnet-20241022",  // Default model
      "delegates_to": ["sisyphus", "oracle"],
      "routing_rules": [
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "model": "claude-opus-4-6"  // Use more capable model for complex tasks
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "model": "claude-3-5-haiku-20241022"  // Use cheaper model for simple tasks
          }
        }
      ]
    }
  }
}
```

---

## Debugging Language Routing

Enable routing logging to see how language detection works:

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

### Example Debug Output

```
[OLIMPUS] Routing decision:
  Prompt: "Write a Python async function for API calls"
  Matcher: regex
  Matched content: matched pattern: /\b(Python|py\.|async def|@dataclass)\b/i
  Target agent: sisyphus
  Config overrides: { prompt: "...", variant: "python" }

  All evaluations:
  - keyword: { type: "keyword", ... } → false
  - regex: { type: "regex", pattern: "\\b(Python|...)\\b" } → true ✓
  - project_context: { type: "project_context", ... } → false
```

---

## Common Patterns

### 1. Language-Specific File Extensions

```jsonc
{
  "matcher": {
    "type": "regex",
    "pattern": "\\.(ts|tsx|js|jsx)\\b",
    "flags": "i"
  }
}
```

### 2. Language-Specific Keywords

```jsonc
{
  "matcher": {
    "type": "keyword",
    "keywords": ["def ", "import ", "from ", "class ", "@decorator"],
    "mode": "any"
  }
}
```

### 3. Framework Detection

```jsonc
{
  "matcher": {
    "type": "regex",
    "pattern": "\\b(Django|@app\\.route|pydantic|asyncpg)\\b",
    "flags": "i"
  }
}
```

---

## See Also

- **[Quickstart Tutorial](01-quickstart.md)** - Getting started with Olimpus
- **[Monorepo Routing](02-monorepo-routing.md)** - Routing in monorepo setups
- **[Team Workflows](03-team-workflows.md)** - Multi-team collaboration
- **[Schema Reference](../SCHEMA.md)** - Complete configuration schema
