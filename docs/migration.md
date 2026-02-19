# Migration Guide

**Migrate from manual agent selection to intelligent routing with Olimpus.**

This guide helps you transition from manually selecting agents in oh-my-opencode to using Olimpus's intelligent meta-agent routing system.

---

## Table of Contents

- [Overview](#overview)
- [Why Migrate?](#why-migrate)
- [Migration Scenarios](#migration-scenarios)
  - [Scenario 1: Direct Agent Usage → Meta-Agent Routing](#scenario-1-direct-agent-usage--meta-agent-routing)
  - [Scenario 2: Category-Based Routing → Meta-Agent Routing](#scenario-2-category-based-routing--meta-agent-routing)
  - [Scenario 3: Mixed Manual/Automatic → Full Automation](#scenario-3-mixed-manualautomatic--full-automation)
- [Step-by-Step Migration](#step-by-step-migration)
- [Quick Migration Templates](#quick-migration-templates)
- [Breaking Changes](#breaking-changes)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What You're Migrating From

**Manual Agent Selection:**
- Explicitly specifying agents in prompts: `@sisyphus`, `@oracle`, `@librarian`
- Manually choosing which agent handles each task
- Context switching between different agent workflows
- Inconsistent agent usage across team members

### What You're Migrating To

**Intelligent Meta-Agent Routing:**
- Define routing rules once in `olimpus.jsonc`
- Meta-agents automatically select the best builtin agent
- Consistent routing behavior across all users
- No more manual agent selection in prompts

---

## Why Migrate?

| Before (Manual) | After (Olimpus) |
|-----------------|-----------------|
| `@oracle analyze this architecture` | `analyze this architecture` |
| `@sisyphus add tests for auth` | `add tests for auth` |
| `@librarian search for docs` | `search for docs` |
| Manual agent selection | Automatic routing |
| Context required | Prompt-driven |
| Inconsistent team usage | Standardized workflows |

### Benefits

1. **Reduced Cognitive Load**: No need to remember which agent to use for each task
2. **Consistent Behavior**: All team members get the same routing logic
3. **Faster Onboarding**: New users don't need to learn agent specialties
4. **Easier Maintenance**: Update routing rules in one place, not across prompts
5. **Better Routing**: Sophisticated matchers (complexity, regex, project context) vs simple @mentions

---

## Migration Scenarios

### Scenario 1: Direct Agent Usage → Meta-Agent Routing

**Before:** Users manually specify agents in prompts.

**After:** Meta-agents route to appropriate agents automatically.

#### Before: `.opencode.jsonc`

```jsonc
{
  "agents": {
    "sisyphus": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.3
    },
    "oracle": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.5
    }
  }
}
```

**Typical prompts:**
```
@oracle design a scalable microservices architecture
@sisyphus implement user authentication with tests
@librarian find documentation about caching strategies
```

#### After: `olimpus.jsonc`

```jsonc
{
  "meta_agents": {
    "atenea": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "prometheus", "metis"],
      "routing_rules": [
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a strategic architecture advisor. Analyze this complex problem from first principles."
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "metis"
        }
      ]
    },
    "hermes": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["librarian", "explore"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["docs", "documentation", "guide"],
            "mode": "any"
          },
          "target_agent": "librarian"
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "librarian"
        }
      ]
    }
  },
  "agents": {
    // Agent overrides preserved from before
    "sisyphus": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.3
    },
    "oracle": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.5
    }
  }
}
```

**After prompts:**
```
design a scalable microservices architecture
implement user authentication with tests
find documentation about caching strategies
```

**Key Changes:**
- No `@agent` prefix required
- Meta-agents handle routing based on complexity, keywords, etc.
- Same agent overrides still work in `agents` section

---

### Scenario 2: Category-Based Routing → Meta-Agent Routing

**Before:** Using categories for domain-specific routing.

**After:** Meta-agents provide more sophisticated routing with multiple matcher types.

#### Before: `.opencode.jsonc`

```jsonc
{
  "agents": {
    "sisyphus": {
      "model": "claude-3-5-sonnet-20241022"
    }
  },
  "categories": {
    "frontend": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.3,
      "skills": ["frontend-patterns"]
    },
    "backend": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.4,
      "skills": ["api-design"]
    }
  }
}
```

**Typical prompts:**
```
create a login component [tag: frontend]
add user API endpoint [tag: backend]
```

#### After: `olimpus.jsonc`

```jsonc
{
  "meta_agents": {
    "frontend_specialist": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["src/components/", "package.json"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a frontend specialist. Build responsive, accessible UI components.",
            "skills": ["frontend-patterns"]
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "hephaestus"
        }
      ]
    },
    "backend_specialist": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "sisyphus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["api", "endpoint", "rest", "graphql"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a backend specialist. Build robust APIs with proper error handling.",
            "skills": ["api-design"]
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "oracle"
        }
      ]
    }
  },
  // Categories still supported for passthrough
  "categories": {
    "frontend": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.3
    },
    "backend": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.4
    }
  }
}
```

**After prompts:**
```
create a login component
add user API endpoint
```

**Key Changes:**
- No `[tag: category]` syntax required
- Meta-agents use project context and keywords to route
- Categories still work as passthrough for compatibility
- Skills can be specified per-routing-rule for more granular control

---

### Scenario 3: Mixed Manual/Automatic → Full Automation

**Before:** Some workflows use tags, some use explicit agents.

**After:** All routing handled by meta-agents consistently.

#### Before: Mixed Usage

```
// Team member A uses categories
add user profile page [tag: frontend]

// Team member B uses explicit agents
@sisyphus add user profile page with tests

// Team member C uses default agent
add user profile page
```

#### After: Unified Routing

```jsonc
{
  "meta_agents": {
    "default_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "tdd"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Write tests first, then implementation (TDD)."
          }
        },
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["src/"]
          },
          "target_agent": "hephaestus"
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "oracle"
        }
      ]
    }
  }
}
```

**After prompts (same for all team members):**
```
add user profile page with tests
```

**Key Changes:**
- All team members get consistent routing
- No need to remember different syntax
- Routing adapts to prompt content automatically

---

## Step-by-Step Migration

### Step 1: Analyze Current Usage

Identify which agents you're currently using and how.

**Audit your prompts:**
```bash
# Search for common agent mentions in your project
grep -r "@oracle\|@sisyphus\|@librarian" . --include="*.md" --include="*.txt"
grep -r "\[tag:\|\\[category:" . --include="*.md" --include="*.txt"
```

**Create an inventory:**

| Agent | Usage Pattern | Frequency |
|-------|---------------|-----------|
| `@oracle` | Architecture decisions | High |
| `@sisyphus` | Implementation with tests | High |
| `@librarian` | Documentation research | Medium |
| `[tag: frontend]` | UI tasks | Low |

### Step 2: Install Olimpus

```bash
# Using Bun (recommended)
bun install olimpus-plugin

# Or npm
npm install olimpus-plugin
```

### Step 3: Update `.opencode.jsonc`

Add Olimpus to your plugin configuration:

```jsonc
{
  "plugins": [
    {
      "name": "olimpus",
      "module": "olimpus-plugin"
    }
    // ... other plugins
  ]
}
```

### Step 4: Create `olimpus.jsonc`

Start with a minimal configuration that preserves your current agent setup:

```jsonc
{
  "meta_agents": {
    // Simple router that preserves manual agent selection
    "preserved_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "librarian", "hephaestus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "hephaestus"
        }
      ]
    }
  },
  // Preserve your existing agent overrides
  "agents": {
    "sisyphus": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.3
    },
    "oracle": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.5
    }
  }
}
```

### Step 5: Validate Configuration

```bash
bun run olimpus validate olimpus.jsonc
```

### Step 6: Test Basic Functionality

Run a few prompts to ensure Olimpus is working:

```
# Test basic routing
hello world

# Test that your agent overrides still work
implement a simple function
```

### Step 7: Implement Intelligent Routing (Gradual)

Add routing rules based on your audit from Step 1:

```jsonc
{
  "meta_agents": {
    "smart_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "librarian", "hephaestus"],
      "routing_rules": [
        // Test/implementation → sisyphus
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "implement", "feature", "fix"],
            "mode": "any"
          },
          "target_agent": "sisyphus"
        },
        // Documentation → librarian
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["docs", "documentation", "guide", "search"],
            "mode": "any"
          },
          "target_agent": "librarian"
        },
        // Architecture → oracle
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["architecture", "design", "strategy", "pattern"],
            "mode": "any"
          },
          "target_agent": "oracle"
        },
        // Default → hephaestus
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

### Step 8: Iterate and Refine

Test with your real-world prompts and refine:

```bash
# Test each routing rule
bun run olimpus validate olimpus.jsonc

# Enable routing logger for debugging
# Add to olimpus.jsonc settings:
# "settings": {
#   "routing_logger": {
#     "enabled": true,
#     "output": "console",
#     "debug_mode": true
#   }
# }
```

### Step 9: Update Team Documentation

Update your team's documentation with the new workflow:

**Before:**
```
Use @oracle for architecture decisions
Use @sisyphus for implementation with tests
Use [tag: frontend] for UI tasks
```

**After:**
```
Describe what you want to accomplish - Olimpus will route to the right agent automatically.
- Architecture/strategy → oracle
- Implementation/tests → sisyphus
- Documentation → librarian
```

### Step 10: Remove Manual Agent Mentions

Clean up prompts by removing `@agent` and `[tag: ...]` syntax:

**Before:**
```markdown
@oracle design a scalable microservices architecture

Consider:
- Service boundaries
- Data consistency
- Error handling
```

**After:**
```markdown
Design a scalable microservices architecture

Consider:
- Service boundaries
- Data consistency
- Error handling
```

---

## Quick Migration Templates

### Template 1: Simple Keyword-Based Router

For teams transitioning from manual agent selection with clear keyword patterns.

```jsonc
{
  "meta_agents": {
    "simple_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "librarian", "hephaestus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["architecture", "design", "analyze", "strategy"],
            "mode": "any"
          },
          "target_agent": "oracle"
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "implement", "build", "fix", "feature"],
            "mode": "any"
          },
          "target_agent": "sisyphus"
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["docs", "documentation", "guide", "search", "lookup"],
            "mode": "any"
          },
          "target_agent": "librarian"
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

### Template 2: Complexity-Based Router

For teams that want routing based on task complexity.

```jsonc
{
  "meta_agents": {
    "complexity_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "prometheus", "metis", "sisyphus"],
      "routing_rules": [
        {
          "matcher": {
            "type": "complexity",
            "threshold": "high"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a strategic advisor. Analyze this complex problem from first principles."
          }
        },
        {
          "matcher": {
            "type": "complexity",
            "threshold": "medium"
          },
          "target_agent": "prometheus",
          "config_overrides": {
            "prompt": "You are a technical strategist. Consider trade-offs and best practices."
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "sisyphus"
        }
      ]
    }
  }
}
```

### Template 3: Project Context Router

For teams with multiple sub-projects or monorepos.

```jsonc
{
  "meta_agents": {
    "context_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle"],
      "routing_rules": [
        // Frontend project → hephaestus
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["src/components/", "src/pages/"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a frontend specialist. Build responsive, accessible UI components."
          }
        },
        // Backend project with tests → sisyphus
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["src/api/", "package.json"],
            "has_deps": ["vitest", "jest"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a TDD expert. Write tests first, then implementation."
          }
        },
        // Default fallback
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "oracle"
        }
      ]
    }
  }
}
```

---

## Breaking Changes

### What Stays The Same

| Feature | Status |
|---------|--------|
| `agents` section in config | ✅ Still works (passthrough) |
| `categories` section | ✅ Still works (passthrough) |
| `skills` section | ✅ Still works |
| Custom agent prompts | ✅ Still work via `config_overrides` |
| Built-in agent behavior | ✅ Unchanged |

### What Changes

| Feature | Before | After |
|---------|--------|-------|
| Agent selection | `@agent` syntax | Automatic routing |
| Domain routing | `[tag: category]` | Meta-agent routing rules |
| Prompt complexity | Required context | Prompt-driven routing |
| Team consistency | Variable | Standardized |

### Compatibility Notes

1. **Backward Compatible**: Your existing `.opencode.jsonc` still works
2. **Agent Overrides**: The `agents` section in `olimpus.jsonc` is a passthrough to oh-my-opencode
3. **Categories**: The `categories` section is also a passthrough
4. **Manual Override**: You can still use `@agent` syntax if needed (meta-agents won't prevent it)

---

## Troubleshooting

### Issue: Routing doesn't match expected agent

**Symptom:**
```
Expected: oracle (architecture task)
Actual: hephaestus (default fallback)
```

**Solution:**

1. Enable routing logger:
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

2. Check rule order (first match wins):
   ```jsonc
   // ❌ Wrong order - "always" matches everything
   "routing_rules": [
     { "matcher": { "type": "always" }, "target_agent": "hephaestus" },
     { "matcher": { "type": "keyword", "keywords": ["architecture"] }, "target_agent": "oracle" }
   ]

   // ✅ Correct order - specific rules first
   "routing_rules": [
     { "matcher": { "type": "keyword", "keywords": ["architecture"] }, "target_agent": "oracle" },
     { "matcher": { "type": "always" }, "target_agent": "hephaestus" }
   ]
   ```

### Issue: Configuration validation errors

**Symptom:**
```
Error: Circular dependency detected: agent_a → agent_b → agent_a
```

**Solution:**

Check for circular delegation chains:
```jsonc
// ❌ Invalid - creates a cycle
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

// ✅ Valid - no cycle
{
  "meta_agents": {
    "agent_a": {
      "delegates_to": ["oracle", "hephaestus"],
      "routing_rules": [{ "matcher": { "type": "always" }, "target_agent": "oracle" }]
    },
    "agent_b": {
      "delegates_to": ["oracle", "hephaestus"],
      "routing_rules": [{ "matcher": { "type": "always" }, "target_agent": "hephaestus" }]
    }
  }
}
```

### Issue: Keywords not matching

**Symptom:**
```
Keyword: "architecture" doesn't match prompt "I need to design a system architecture"
```

**Solution:**

Keyword matching is case-insensitive but requires exact word match:

```jsonc
// ❌ Won't match - "architectures" (plural)
"matcher": {
  "type": "keyword",
  "keywords": ["architecture"],
  "mode": "any"
}

// ✅ Better - include variations
"matcher": {
  "type": "keyword",
  "keywords": ["architecture", "architectural", "architectures", "design"],
  "mode": "any"
}

// ✅ Best - use regex for patterns
"matcher": {
  "type": "regex",
  "pattern": "architecture|architectural|design.*system",
  "flags": "i"
}
```

### Issue: Project context not detecting files

**Symptom:**
```
project_context matcher doesn't match when package.json exists
```

**Solution:**

Verify file paths are correct and relative to project root:

```jsonc
// ❌ Wrong - absolute path
"matcher": {
  "type": "project_context",
  "has_files": ["/Users/me/project/package.json"]
}

// ❌ Wrong - doesn't include package.json
"matcher": {
  "type": "project_context",
  "has_files": ["src/"]  // Directory only
}

// ✅ Correct - file relative to project root
"matcher": {
  "type": "project_context",
  "has_files": ["package.json"]
}

// ✅ Also correct - wildcard pattern
"matcher": {
  "type": "project_context",
  "has_files": ["**/*.json"]
}
```

### Issue: Existing prompts don't work as expected

**Symptom:**
```
Prompt "Implement feature X" doesn't use sisyphus (expected behavior)
```

**Solution:**

If you still need manual agent selection during migration:

1. Keep using `@agent` syntax temporarily:
   ```
   @sisyphus implement feature X
   ```

2. Update routing rules to match your patterns:
   ```jsonc
   {
     "matcher": {
       "type": "keyword",
       "keywords": ["implement", "feature"],
       "mode": "any"
     },
     "target_agent": "sisyphus"
   }
   ```

3. Gradually transition to prompts without `@agent`:
   ```
   implement feature X
   ```

---

## Migration Checklist

Use this checklist to ensure a complete migration:

### Planning
- [ ] Audit current agent usage patterns
- [ ] Identify frequently used agents
- [ ] Document common prompt patterns
- [ ] Choose migration template

### Configuration
- [ ] Install olimpus-plugin
- [ ] Update `.opencode.jsonc` to include Olimpus
- [ ] Create `olimpus.jsonc` with initial config
- [ ] Preserve existing `agents` overrides
- [ ] Validate configuration: `bun run olimpus validate`

### Testing
- [ ] Test basic routing functionality
- [ ] Test each routing rule with example prompts
- [ ] Verify agent overrides still work
- [ ] Test with real-world prompts
- [ ] Enable routing logger for debugging

### Deployment
- [ ] Update team documentation
- [ ] Share migration guide with team
- [ ] Provide migration support period
- [ ] Monitor routing effectiveness

### Cleanup
- [ ] Remove `@agent` mentions from prompts
- [ ] Remove `[tag: ...]` syntax from prompts
- [ ] Update onboarding materials
- [ ] Document custom routing rules

---

## Next Steps

After completing migration:

1. **Explore Advanced Features**
   - [Read the tutorials](./tutorials/) for real-world use cases
   - [Check the troubleshooting guide](./troubleshooting.md)
   - [Review the API reference](./API.md)

2. **Refine Your Routing**
   - Monitor routing decisions with the logger
   - Adjust rules based on team feedback
   - Experiment with different matcher types

3. **Share Your Experience**
   - Conduct knowledge sharing sessions
   - Document best practices
   - Share routing rules with the community

---

## Need Help?

- **Configuration Issues**: Run `bun run olimpus validate olimpus.jsonc`
- **Routing Problems**: Enable debug mode in routing_logger settings
- **Documentation**: See [README.md](../README.md) for overview
- **Tutorials**: Check [tutorials/](./tutorials/) for real-world examples
- **API Reference**: See [API.md](./API.md) for complete API documentation
